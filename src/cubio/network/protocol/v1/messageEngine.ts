/**
 * CUBiO Network Protocol v1 — Canonical Message Engine
 * ============================================================
 *
 * Implements message factory, validation, lifecycle transitions,
 * deterministic serialization, and bidirectional bridges to ProtocolEnvelope (Task 01)
 * and CubiOPacket[] (Task 02).
 *
 * REUSED SYSTEMS:
 *   - deterministicHash (src/cubio/state/determinism.ts)
 *   - CubiONetworkCoordinateEngine (src/cubio/network/coordinate/coordinate.ts)
 *   - ProtocolEnvelope, createEnvelope (src/cubio/network/protocol/v1/protocolEngine.ts)
 *   - CubiOPacket, packetizeEnvelope, reassembleEnvelope (src/cubio/network/protocol/v1/packetEngine.ts)
 */

import { deterministicHash } from '../../../state/determinism';
import { CubiONetworkCoordinateEngine } from '../../coordinate/coordinate';
import {
  ProtocolEnvelope,
  ProtocolAddress,
  ProtocolPrincipal,
  ProtocolPayload,
  PayloadCategory,
  EnvelopeKind,
  PROTOCOL_VERSION_STRING,
} from './types';
import { createEnvelope } from './protocolEngine';
import { CubiOPacket } from './packetTypes';
import { packetizeEnvelope, reassembleEnvelope } from './packetEngine';
import {
  MAX_MESSAGE_PAYLOAD_BYTES,
  DEFAULT_MESSAGE_TTL_MS,
  type CanonicalMessageType,
  type MessageCommunicationMode,
  type MessagePriority,
  type MessageLifecycleState,
  type CubiOMessage,
  type CreateMessageOptions,
  type MessageValidationError,
  type MessageValidationResult,
} from './messageTypes';

// ─────────────────────────────────────────────────────────────────────────────
// Valid Sets & Patterns
// ─────────────────────────────────────────────────────────────────────────────

const VALID_MESSAGE_TYPES: ReadonlySet<CanonicalMessageType> = new Set<CanonicalMessageType>([
  'DIRECT',
  'CHANNEL_BROADCAST',
  'SYSTEM_NOTICE',
  'SPATIAL_EVENT',
  'RPC_REQUEST',
  'RPC_RESPONSE',
  'AGENT_PROMPT',
  'AGENT_RESPONSE',
]);

const VALID_MODES: ReadonlySet<MessageCommunicationMode> = new Set<MessageCommunicationMode>([
  'USER_USER',
  'USER_AGENT',
  'USER_SERVICE',
  'AGENT_AGENT',
  'SERVICE_SERVICE',
]);

const VALID_PRIORITIES: ReadonlySet<MessagePriority> = new Set<MessagePriority>([
  'LOW',
  'NORMAL',
  'HIGH',
  'URGENT',
]);

const VALID_LIFECYCLE_STATES: ReadonlySet<MessageLifecycleState> = new Set<MessageLifecycleState>([
  'DRAFT',
  'QUEUED',
  'IN_TRANSIT',
  'DELIVERED',
  'READ',
  'REJECTED',
  'FAILED',
  'EXPIRED',
]);

const CUB_ID_REGEX = /^CUB-[A-Z0-9]{8}$/;

function deterministicStringify(val: unknown): string {
  if (val === null || typeof val !== 'object') {
    return JSON.stringify(val);
  }
  if (Array.isArray(val)) {
    return `[${val.map(deterministicStringify).join(',')}]`;
  }
  const keys = Object.keys(val as object).sort();
  const entries = keys.map(k => `${JSON.stringify(k)}:${deterministicStringify((val as Record<string, unknown>)[k])}`);
  return `{${entries.join(',')}}`;
}

/**
 * Computes deterministic content hash of a message payload.
 */
export function computeMessagePayloadHash(body: unknown): string {
  const serialized = typeof body === 'string' ? body : deterministicStringify(body);
  return `0xMPL_${deterministicHash(serialized).slice(2, 18)}`;
}

/**
 * Computes deterministic message ID from key routing parameters.
 */
export function generateMessageId(
  senderCubId: string,
  destUri: string,
  type: CanonicalMessageType,
  timestamp: number,
  nonce?: string
): string {
  const seed = `${senderCubId}|${destUri}|${type}|${timestamp}|${nonce ?? ''}`;
  return `MSG_${deterministicHash(seed).slice(2, 18)}`;
}

/**
 * Computes a deterministic mock signature for message provenance.
 */
export function signMessageContent(messageId: string, senderCubId: string, payloadHash: string): string {
  return `0xSIG_${deterministicHash(`${messageId}:${senderCubId}:${payloadHash}`).slice(2, 34)}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Message Factory
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Constructs a frozen, validated, canonical CubiOMessage.
 */
export function createMessage<T = unknown>(options: CreateMessageOptions<T>): CubiOMessage<T> {
  const createdAt = Date.now();
  const ttlMs = options.ttlMs ?? DEFAULT_MESSAGE_TTL_MS;
  const expiresAt = createdAt + ttlMs;

  const serializedBody = typeof options.body === 'string' ? options.body : deterministicStringify(options.body);
  const byteLength = Buffer.byteLength(serializedBody, 'utf8');
  const contentHash = computeMessagePayloadHash(options.body);

  const messageId = generateMessageId(
    options.source.cubId,
    options.destination.coordinateUri,
    options.type,
    createdAt,
    options.nonce
  );

  const signature = options.signature ?? signMessageContent(messageId, options.source.cubId, contentHash);

  const metadata = Object.freeze({ ...(options.metadata ?? {}) });

  return Object.freeze({
    protocolVersion: PROTOCOL_VERSION_STRING,
    messageId,
    conversationId: options.conversationId,
    correlationId: options.correlationId,
    type: options.type,
    communicationMode: options.communicationMode,
    priority: options.priority ?? 'NORMAL',
    state: 'DRAFT',
    source: Object.freeze({ ...options.source }),
    destination: Object.freeze({ ...options.destination }),
    subject: options.subject,
    payload: Object.freeze({
      contentType: options.contentType ?? 'application/json',
      body: options.body,
      byteLength,
      contentHash,
      schemaUri: options.schemaUri,
    }),
    metadata,
    signature,
    timestamps: Object.freeze({
      createdAt,
      expiresAt,
    }),
    traceRoute: Object.freeze([options.source.coordinateUri]),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Message Validator
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validates a message against all canonical constraints.
 */
export function validateMessage(message: any): MessageValidationResult {
  const errors: MessageValidationError[] = [];

  if (!message || typeof message !== 'object') {
    errors.push({ code: 'ERR_MALFORMED_STRUCTURE', message: 'Message must be a non-null object.' });
    return Object.freeze({ valid: false, errors: Object.freeze(errors) });
  }

  // 1. Version
  if (message.protocolVersion !== PROTOCOL_VERSION_STRING) {
    errors.push({
      code: 'ERR_INVALID_VERSION',
      message: `Expected protocol version '${PROTOCOL_VERSION_STRING}', got '${message.protocolVersion}'.`,
      field: 'protocolVersion',
    });
  }

  // 2. Message ID
  if (!message.messageId || typeof message.messageId !== 'string' || !message.messageId.startsWith('MSG_')) {
    errors.push({ code: 'ERR_INVALID_MESSAGE_ID', message: 'Invalid or missing messageId.', field: 'messageId' });
  }

  // 3. Type
  if (!message.type || !VALID_MESSAGE_TYPES.has(message.type)) {
    errors.push({ code: 'ERR_INVALID_TYPE', message: `Invalid message type '${message.type}'.`, field: 'type' });
  }

  // 4. Communication Mode
  if (!message.communicationMode || !VALID_MODES.has(message.communicationMode)) {
    errors.push({ code: 'ERR_INVALID_MODE', message: `Invalid communicationMode '${message.communicationMode}'.`, field: 'communicationMode' });
  }

  // 5. Priority
  if (!message.priority || !VALID_PRIORITIES.has(message.priority)) {
    errors.push({ code: 'ERR_INVALID_PRIORITY', message: `Invalid priority '${message.priority}'.`, field: 'priority' });
  }

  // 6. Lifecycle State
  if (!message.state || !VALID_LIFECYCLE_STATES.has(message.state)) {
    errors.push({ code: 'ERR_INVALID_STATE', message: `Invalid lifecycle state '${message.state}'.`, field: 'state' });
  }

  // 7. Source Validation
  if (!message.source || typeof message.source !== 'object') {
    errors.push({ code: 'ERR_INVALID_SOURCE', message: 'Missing source endpoint.', field: 'source' });
  } else {
    if (!message.source.cubId || !CUB_ID_REGEX.test(message.source.cubId)) {
      errors.push({ code: 'ERR_INVALID_SOURCE', message: `Source cubId must match CUB-XXXXXXXX. Got '${message.source.cubId}'.`, field: 'source.cubId' });
    }
    if (!message.source.coordinateUri || typeof message.source.coordinateUri !== 'string') {
      errors.push({ code: 'ERR_INVALID_SOURCE', message: 'Missing source coordinateUri.', field: 'source.coordinateUri' });
    } else {
      const srcCoordVal = CubiONetworkCoordinateEngine.tryParse(message.source.coordinateUri);
      if (!srcCoordVal.isValid) {
        errors.push({ code: 'ERR_INVALID_SOURCE', message: `Invalid source coordinateUri: ${srcCoordVal.errors[0]?.message}`, field: 'source.coordinateUri' });
      }
    }
  }

  // 8. Destination Validation
  if (!message.destination || typeof message.destination !== 'object') {
    errors.push({ code: 'ERR_INVALID_DESTINATION', message: 'Missing destination endpoint.', field: 'destination' });
  } else {
    if (!message.destination.coordinateUri || typeof message.destination.coordinateUri !== 'string') {
      errors.push({ code: 'ERR_INVALID_DESTINATION', message: 'Missing destination coordinateUri.', field: 'destination.coordinateUri' });
    } else {
      const dstCoordVal = CubiONetworkCoordinateEngine.tryParse(message.destination.coordinateUri);
      if (!dstCoordVal.isValid) {
        errors.push({ code: 'ERR_INVALID_DESTINATION', message: `Invalid destination coordinateUri: ${dstCoordVal.errors[0]?.message}`, field: 'destination.coordinateUri' });
      }
    }
    if (message.destination.recipientCubId && !CUB_ID_REGEX.test(message.destination.recipientCubId)) {
      errors.push({ code: 'ERR_INVALID_DESTINATION', message: `Destination recipientCubId must match CUB-XXXXXXXX. Got '${message.destination.recipientCubId}'.`, field: 'destination.recipientCubId' });
    }
  }

  // 9. Payload Validation
  if (!message.payload || typeof message.payload !== 'object') {
    errors.push({ code: 'ERR_PAYLOAD_MISSING', message: 'Missing payload container.', field: 'payload' });
  } else {
    if (message.payload.body === undefined) {
      errors.push({ code: 'ERR_PAYLOAD_MISSING', message: 'Payload body cannot be undefined.', field: 'payload.body' });
    } else {
      const serialized = typeof message.payload.body === 'string' ? message.payload.body : JSON.stringify(message.payload.body);
      const actualByteLength = Buffer.byteLength(serialized, 'utf8');
      if (actualByteLength > MAX_MESSAGE_PAYLOAD_BYTES) {
        errors.push({
          code: 'ERR_PAYLOAD_TOO_LARGE',
          message: `Payload size (${actualByteLength} bytes) exceeds maximum (${MAX_MESSAGE_PAYLOAD_BYTES} bytes).`,
          field: 'payload.byteLength',
        });
      }
      const expectedHash = computeMessagePayloadHash(message.payload.body);
      if (message.payload.contentHash !== expectedHash) {
        errors.push({
          code: 'ERR_PAYLOAD_HASH_MISMATCH',
          message: 'Payload contentHash does not match computed hash.',
          field: 'payload.contentHash',
        });
      }
    }
  }

  // 10. Signature
  if (!message.signature || typeof message.signature !== 'string') {
    errors.push({ code: 'ERR_SIGNATURE_MISSING', message: 'Missing signature.', field: 'signature' });
  }

  // 11. Timestamps
  if (!message.timestamps || typeof message.timestamps !== 'object') {
    errors.push({ code: 'ERR_TIMESTAMPS_INCONSISTENT', message: 'Missing timestamps object.', field: 'timestamps' });
  } else {
    const { createdAt, sentAt, deliveredAt, readAt, expiresAt } = message.timestamps;
    if (typeof createdAt !== 'number' || createdAt <= 0) {
      errors.push({ code: 'ERR_TIMESTAMPS_INCONSISTENT', message: 'createdAt must be positive number.', field: 'timestamps.createdAt' });
    }
    if (typeof expiresAt !== 'number' || expiresAt <= createdAt) {
      errors.push({ code: 'ERR_TIMESTAMPS_INCONSISTENT', message: 'expiresAt must be greater than createdAt.', field: 'timestamps.expiresAt' });
    }
    if (sentAt !== undefined && sentAt < createdAt) {
      errors.push({ code: 'ERR_TIMESTAMPS_INCONSISTENT', message: 'sentAt cannot precede createdAt.', field: 'timestamps.sentAt' });
    }
    if (deliveredAt !== undefined && sentAt !== undefined && deliveredAt < sentAt) {
      errors.push({ code: 'ERR_TIMESTAMPS_INCONSISTENT', message: 'deliveredAt cannot precede sentAt.', field: 'timestamps.deliveredAt' });
    }
    if (readAt !== undefined && deliveredAt !== undefined && readAt < deliveredAt) {
      errors.push({ code: 'ERR_TIMESTAMPS_INCONSISTENT', message: 'readAt cannot precede deliveredAt.', field: 'timestamps.readAt' });
    }
  }

  const valid = errors.length === 0;
  return Object.freeze({
    valid,
    errors: Object.freeze(errors),
    message: valid ? (message as CubiOMessage) : undefined,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Lifecycle Transitions
// ─────────────────────────────────────────────────────────────────────────────

const PERMITTED_MESSAGE_TRANSITIONS: ReadonlyMap<MessageLifecycleState, ReadonlySet<MessageLifecycleState>> = new Map([
  ['DRAFT',       new Set<MessageLifecycleState>(['QUEUED', 'REJECTED'])],
  ['QUEUED',      new Set<MessageLifecycleState>(['IN_TRANSIT', 'REJECTED'])],
  ['IN_TRANSIT',  new Set<MessageLifecycleState>(['DELIVERED', 'FAILED', 'EXPIRED'])],
  ['DELIVERED',   new Set<MessageLifecycleState>(['READ', 'EXPIRED'])],
  ['READ',        new Set<MessageLifecycleState>()], // Terminal
  ['REJECTED',    new Set<MessageLifecycleState>()], // Terminal
  ['FAILED',      new Set<MessageLifecycleState>()], // Terminal
  ['EXPIRED',     new Set<MessageLifecycleState>()], // Terminal
]);

/**
 * Deterministically transitions a message to a new lifecycle state.
 * Returns a new frozen message with updated timestamps.
 */
export function transitionMessageState<T>(
  message: CubiOMessage<T>,
  nextState: MessageLifecycleState,
  transitionTime: number = Date.now()
): CubiOMessage<T> {
  const allowed = PERMITTED_MESSAGE_TRANSITIONS.get(message.state);
  if (!allowed || !allowed.has(nextState)) {
    throw new Error(
      `Invalid message lifecycle transition: '${message.state}' → '${nextState}'. ` +
      `Allowed: [${allowed ? Array.from(allowed).join(', ') : 'NONE'}].`
    );
  }

  const updatedTimestamps = { ...message.timestamps };
  if (nextState === 'IN_TRANSIT' && !updatedTimestamps.sentAt) {
    (updatedTimestamps as any).sentAt = transitionTime;
  }
  if (nextState === 'DELIVERED' && !updatedTimestamps.deliveredAt) {
    (updatedTimestamps as any).deliveredAt = transitionTime;
  }
  if (nextState === 'READ' && !updatedTimestamps.readAt) {
    (updatedTimestamps as any).readAt = transitionTime;
  }

  return Object.freeze({
    ...message,
    state: nextState,
    timestamps: Object.freeze(updatedTimestamps),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Serialization & Deserialization
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Deterministically serializes a message to canonical JSON wire string.
 */
export function serializeMessage<T>(message: CubiOMessage<T>): string {
  const sortedMeta: Record<string, string> = {};
  for (const k of Object.keys(message.metadata).sort()) {
    sortedMeta[k] = message.metadata[k];
  }

  const normalized = {
    protocolVersion: message.protocolVersion,
    messageId: message.messageId,
    conversationId: message.conversationId,
    correlationId: message.correlationId,
    type: message.type,
    communicationMode: message.communicationMode,
    priority: message.priority,
    state: message.state,
    source: {
      cubId: message.source.cubId,
      coordinateUri: message.source.coordinateUri,
      entityType: message.source.entityType,
      displayName: message.source.displayName,
    },
    destination: {
      coordinateUri: message.destination.coordinateUri,
      recipientCubId: message.destination.recipientCubId,
      channelId: message.destination.channelId,
    },
    subject: message.subject,
    payload: {
      contentType: message.payload.contentType,
      body: message.payload.body,
      byteLength: message.payload.byteLength,
      contentHash: message.payload.contentHash,
      schemaUri: message.payload.schemaUri,
    },
    metadata: sortedMeta,
    signature: message.signature,
    timestamps: message.timestamps,
    traceRoute: message.traceRoute,
  };

  return JSON.stringify(normalized);
}

/**
 * Deserializes a canonical JSON wire string into a validated CubiOMessage.
 */
export function deserializeMessage<T = unknown>(wireString: string): CubiOMessage<T> {
  let parsed: any;
  try {
    parsed = JSON.parse(wireString);
  } catch (err: any) {
    throw new Error(`Failed to deserialize message: Invalid JSON - ${err.message}`);
  }

  const valResult = validateMessage(parsed);
  if (!valResult.valid || !valResult.message) {
    const msg = valResult.errors.map(e => `[${e.code}] ${e.field ?? 'message'}: ${e.message}`).join('; ');
    throw new Error(`Failed to deserialize message: Validation failed - ${msg}`);
  }

  return valResult.message as CubiOMessage<T>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Bidirectional Envelope Bridge (Task 03 <-> Task 01)
// ─────────────────────────────────────────────────────────────────────────────

function mapMessageTypeToEnvelopeKind(type: CanonicalMessageType): EnvelopeKind {
  switch (type) {
    case 'RPC_REQUEST':
      return 'REQUEST';
    case 'RPC_RESPONSE':
      return 'RESPONSE';
    case 'CHANNEL_BROADCAST':
    case 'SPATIAL_EVENT':
      return 'EVENT';
    default:
      return 'REQUEST';
  }
}

function mapMessageTypeToPayloadCategory(type: CanonicalMessageType): PayloadCategory {
  switch (type) {
    case 'DIRECT':
      return 'DIRECT_MESSAGE';
    case 'CHANNEL_BROADCAST':
      return 'CHANNEL_BROADCAST';
    case 'RPC_REQUEST':
      return 'RPC_REQUEST';
    case 'RPC_RESPONSE':
      return 'RPC_RESPONSE';
    case 'SPATIAL_EVENT':
      return 'STATE_DELTA';
    case 'SYSTEM_NOTICE':
      return 'SYSTEM_NOTIFICATION';
    default:
      return 'DIRECT_MESSAGE';
  }
}

/**
 * Bridges a CubiOMessage into a canonical ProtocolEnvelope (Task 01).
 */
export function messageToEnvelope<T>(message: CubiOMessage<T>): ProtocolEnvelope<T> {
  const sourceCoord = CubiONetworkCoordinateEngine.parse(message.source.coordinateUri);
  const destCoord = CubiONetworkCoordinateEngine.parse(message.destination.coordinateUri);

  const sourceAddress: ProtocolAddress = Object.freeze({
    coordinate: sourceCoord,
    uri: message.source.coordinateUri,
  });

  const destAddress: ProtocolAddress = Object.freeze({
    coordinate: destCoord,
    uri: message.destination.coordinateUri,
  });

  const senderPrincipal: ProtocolPrincipal = Object.freeze({
    cubId: message.source.cubId,
    entityType: message.source.entityType,
    signature: message.signature,
  });

  const protocolPayload: ProtocolPayload<T> = Object.freeze({
    category: mapMessageTypeToPayloadCategory(message.type),
    priority: message.priority,
    contentType: message.payload.contentType,
    body: message.payload.body,
    bodyBytes: message.payload.byteLength,
    metadata: message.metadata,
  });

  return createEnvelope<T>({
    kind: mapMessageTypeToEnvelopeKind(message.type),
    source: sourceAddress,
    destination: destAddress,
    sender: senderPrincipal,
    payload: protocolPayload,
    correlationId: message.correlationId,
    ttlMs: message.timestamps.expiresAt - message.timestamps.createdAt,
    nonce: message.messageId,
  });
}

/**
 * Reconstructs a CubiOMessage from a received ProtocolEnvelope.
 */
export function envelopeToMessage<T>(envelope: ProtocolEnvelope<T>): CubiOMessage<T> {
  const body = envelope.payload.body;
  const serialized = typeof body === 'string' ? body : JSON.stringify(body);
  const byteLength = Buffer.byteLength(serialized, 'utf8');
  const contentHash = computeMessagePayloadHash(body);

  let msgType: CanonicalMessageType = 'DIRECT';
  if (envelope.payload.category === 'CHANNEL_BROADCAST') msgType = 'CHANNEL_BROADCAST';
  else if (envelope.payload.category === 'RPC_REQUEST') msgType = 'RPC_REQUEST';
  else if (envelope.payload.category === 'RPC_RESPONSE') msgType = 'RPC_RESPONSE';
  else if (envelope.payload.category === 'STATE_DELTA') msgType = 'SPATIAL_EVENT';
  else if (envelope.payload.category === 'SYSTEM_NOTIFICATION') msgType = 'SYSTEM_NOTICE';

  const metadata: Record<string, string> = { ...(envelope.payload.metadata ?? {}) };

  return Object.freeze({
    protocolVersion: PROTOCOL_VERSION_STRING,
    messageId: `MSG_${envelope.envelopeId.replace('ENV_', '')}`,
    correlationId: envelope.correlationId,
    type: msgType,
    communicationMode: 'USER_USER',
    priority: envelope.payload.priority,
    state: 'DELIVERED',
    source: Object.freeze({
      cubId: envelope.sender.cubId,
      coordinateUri: envelope.source.uri,
      entityType: envelope.sender.entityType,
    }),
    destination: Object.freeze({
      coordinateUri: envelope.destination.uri,
    }),
    payload: Object.freeze({
      contentType: envelope.payload.contentType,
      body,
      byteLength,
      contentHash,
    }),
    metadata: Object.freeze(metadata),
    signature: envelope.sender.signature,
    timestamps: Object.freeze({
      createdAt: envelope.timestamp,
      sentAt: envelope.timestamp,
      deliveredAt: Date.now(),
      expiresAt: envelope.timestamp + envelope.ttlMs,
    }),
    traceRoute: envelope.traceRoute,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Direct Packet Pipeline (Task 03 <-> Task 02)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Converts a CubiOMessage directly into an array of CubiOPackets.
 * Encapsulates message -> envelope -> packet fragments.
 */
export function messageToPackets<T>(message: CubiOMessage<T>, mtu?: number): readonly CubiOPacket[] {
  const envelope = messageToEnvelope(message);
  return packetizeEnvelope(envelope, mtu);
}

/**
 * Reassembles an array of CubiOPackets directly into the reconstructed CubiOMessage.
 * Encapsulates packet fragments -> envelope -> message.
 */
export function packetsToMessage<T = unknown>(packets: readonly CubiOPacket[]): CubiOMessage<T> {
  const envelope = reassembleEnvelope(packets);
  return envelopeToMessage<T>(envelope as ProtocolEnvelope<T>);
}
