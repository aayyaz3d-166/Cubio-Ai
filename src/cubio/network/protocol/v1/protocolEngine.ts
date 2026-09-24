/**
 * CUBiO Network Protocol v1 — Envelope Factory & Validator
 * ============================================================
 *
 * Implements deterministic envelope construction, strict validation,
 * lifecycle tracking, and version negotiation for CNP/1.
 *
 * REUSED VERIFIED STRUCTURES:
 *   - CubiONetworkCoordinateEngine  (coordinate creation / validation / serialisation)
 *   - deterministicHash              (envelope ID generation)
 *   - CubiOIdentityManager           (signature generation / verification)
 *
 * ARCHITECTURAL BOUNDARIES:
 *   - This module does NOT provide transport.  It constructs and validates
 *     envelopes that a transport layer (future Task 02+) will transmit.
 *   - This module does NOT store envelopes.  It is pure-function / stateless
 *     except for lifecycle tracking on individual envelopes.
 */

import { deterministicHash } from '../../../state/determinism';
import { CubiONetworkCoordinateEngine } from '../../coordinate/coordinate';
import type { CubiONetworkCoordinate } from '../../coordinate/types';
import {
  type ProtocolAddress,
  type ProtocolPrincipal,
  type ProtocolVersion,
  type ProtocolEnvelope,
  type ProtocolPayload,
  type ProtocolError,
  type ProtocolErrorCode,
  type EnvelopeValidationResult,
  type EnvelopeKind,
  type PayloadCategory,
  type PayloadPriority,
  type EnvelopeLifecycle,
  type EnvelopeLifecycleState,
  type LifecycleTransition,
  type VersionHandshakeBody,
  type VersionHandshakeResult,
  PROTOCOL_VERSION,
  PROTOCOL_VERSION_STRING,
  MIN_COMPATIBLE_VERSION,
  MAX_PAYLOAD_BYTES,
  MAX_ENVELOPE_TTL_MS,
  DEFAULT_ENVELOPE_TTL_MS,
  MAX_TRACE_HOPS,
} from './types';

// ─────────────────────────────────────────────────────────────────────────────
// Valid value sets (used by the validator)
// ─────────────────────────────────────────────────────────────────────────────

const VALID_ENVELOPE_KINDS: ReadonlySet<string> = new Set<EnvelopeKind>([
  'REQUEST', 'RESPONSE', 'EVENT', 'ACK', 'NACK', 'PING', 'PONG', 'VERSION_NEGOTIATE',
]);

const VALID_PAYLOAD_CATEGORIES: ReadonlySet<string> = new Set<PayloadCategory>([
  'DIRECT_MESSAGE', 'CHANNEL_BROADCAST',
  'RPC_REQUEST', 'RPC_RESPONSE',
  'STATE_DELTA', 'STATE_SNAPSHOT',
  'SYSTEM_NOTIFICATION', 'HEALTH_CHECK', 'VERSION_HANDSHAKE',
  'FILE_TRANSFER_INIT', 'FILE_CHUNK', 'FILE_TRANSFER_COMPLETE',
]);

const VALID_PRIORITIES: ReadonlySet<string> = new Set<PayloadPriority>([
  'LOW', 'NORMAL', 'HIGH', 'URGENT',
]);

const CUB_ID_REGEX = /^CUB-[A-Z0-9]{8}$/;

// ─────────────────────────────────────────────────────────────────────────────
// Public: Address Factory
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates a validated ProtocolAddress from a CNC coordinate.
 * Re-uses the existing CubiONetworkCoordinateEngine for validation.
 */
export function createProtocolAddress(coord: CubiONetworkCoordinate): ProtocolAddress {
  const validation = CubiONetworkCoordinateEngine.validate(coord);
  if (!validation.isValid) {
    const msg = validation.errors.map(e => `${e.field}: ${e.message}`).join('; ');
    throw new Error(`Invalid protocol address: ${msg}`);
  }
  return Object.freeze({
    coordinate: Object.freeze({ ...coord }),
    uri: CubiONetworkCoordinateEngine.format(coord),
  });
}

/**
 * Parses a CNC URI string into a ProtocolAddress.
 */
export function parseProtocolAddress(uri: string): ProtocolAddress {
  const coord = CubiONetworkCoordinateEngine.parse(uri);
  return Object.freeze({
    coordinate: coord,
    uri: CubiONetworkCoordinateEngine.format(coord),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Public: Envelope Factory
// ─────────────────────────────────────────────────────────────────────────────

/** Input options for envelope construction. */
export interface CreateEnvelopeInput<T = unknown> {
  readonly kind: EnvelopeKind;
  readonly source: ProtocolAddress;
  readonly destination: ProtocolAddress;
  readonly sender: ProtocolPrincipal;
  readonly payload: ProtocolPayload<T>;
  readonly correlationId?: string;
  readonly ttlMs?: number;
  readonly nonce?: string;
}

/**
 * Constructs a frozen, deterministically-identified ProtocolEnvelope.
 *
 * Envelope ID = deterministicHash( source.uri + destination.uri + nonce + timestamp )
 *
 * Does NOT validate — call `validateEnvelope()` after construction if you
 * need pre-send validation.
 */
export function createEnvelope<T = unknown>(input: CreateEnvelopeInput<T>): ProtocolEnvelope<T> {
  const timestamp = Date.now();
  const ttl = input.ttlMs ?? DEFAULT_ENVELOPE_TTL_MS;
  const nonce = input.nonce ?? `${timestamp}`;
  const rawId = `${input.source.uri}|${input.destination.uri}|${nonce}|${timestamp}`;
  const envelopeId = `ENV_${deterministicHash(rawId).slice(2, 18)}`;

  return Object.freeze({
    protocolVersion: PROTOCOL_VERSION_STRING,
    envelopeId,
    kind: input.kind,
    correlationId: input.correlationId,
    timestamp,
    ttlMs: ttl,
    traceRoute: Object.freeze([input.source.uri]),
    source: input.source,
    destination: input.destination,
    sender: input.sender,
    payload: Object.freeze({ ...input.payload }),
  });
}

/**
 * Creates a PONG response envelope for a received PING.
 */
export function createPong(
  ping: ProtocolEnvelope,
  responderAddress: ProtocolAddress,
  responderPrincipal: ProtocolPrincipal,
): ProtocolEnvelope<{ pongTimestamp: number }> {
  return createEnvelope({
    kind: 'PONG',
    source: responderAddress,
    destination: ping.source,
    sender: responderPrincipal,
    correlationId: ping.envelopeId,
    payload: {
      category: 'HEALTH_CHECK',
      priority: 'NORMAL',
      contentType: 'application/json',
      body: { pongTimestamp: Date.now() },
      bodyBytes: 32,
    },
  });
}

/**
 * Creates a NACK (negative acknowledgement) for a rejected envelope.
 */
export function createNack(
  rejected: ProtocolEnvelope,
  responderAddress: ProtocolAddress,
  responderPrincipal: ProtocolPrincipal,
  errors: readonly ProtocolError[],
): ProtocolEnvelope<{ errors: readonly ProtocolError[] }> {
  return createEnvelope({
    kind: 'NACK',
    source: responderAddress,
    destination: rejected.source,
    sender: responderPrincipal,
    correlationId: rejected.envelopeId,
    payload: {
      category: 'SYSTEM_NOTIFICATION',
      priority: 'HIGH',
      contentType: 'application/json',
      body: { errors },
      bodyBytes: JSON.stringify(errors).length,
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Public: Envelope Validator
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validates a ProtocolEnvelope against all CNP/1 invariants.
 * Returns a list of structured errors (empty = valid).
 *
 * Checks performed:
 *   1. Protocol version presence and compatibility
 *   2. Envelope ID presence
 *   3. Kind is a known value
 *   4. Source and destination addresses are valid CNC coordinates
 *   5. Sender cubId format
 *   6. TTL within bounds and not expired
 *   7. Trace route length
 *   8. Payload category, priority, content type
 *   9. Payload size
 */
export function validateEnvelope(envelope: any): EnvelopeValidationResult {
  const errors: ProtocolError[] = [];

  if (!envelope || typeof envelope !== 'object') {
    errors.push({ code: 'ERR_INTERNAL', message: 'Envelope must be a non-null object.' });
    return Object.freeze({ valid: false, errors: Object.freeze(errors) });
  }

  // 1. Protocol version
  if (!envelope.protocolVersion || typeof envelope.protocolVersion !== 'string') {
    errors.push({ code: 'ERR_INVALID_VERSION', message: 'Missing or invalid protocolVersion.', field: 'protocolVersion' });
  } else {
    const compat = checkVersionCompatibility(envelope.protocolVersion);
    if (!compat.accepted) {
      errors.push({ code: 'ERR_VERSION_INCOMPATIBLE', message: compat.reason || 'Incompatible version.', field: 'protocolVersion' });
    }
  }

  // 2. Envelope ID
  if (!envelope.envelopeId || typeof envelope.envelopeId !== 'string') {
    errors.push({ code: 'ERR_MISSING_ENVELOPE_ID', message: 'Missing envelopeId.', field: 'envelopeId' });
  }

  // 3. Kind
  if (!envelope.kind || !VALID_ENVELOPE_KINDS.has(envelope.kind)) {
    errors.push({ code: 'ERR_INTERNAL', message: `Unknown envelope kind '${envelope.kind}'.`, field: 'kind' });
  }

  // 4. Source address
  if (!envelope.source || !envelope.source.coordinate) {
    errors.push({ code: 'ERR_MISSING_SOURCE', message: 'Missing source address.', field: 'source' });
  } else {
    const srcVal = CubiONetworkCoordinateEngine.validate(envelope.source.coordinate);
    if (!srcVal.isValid) {
      errors.push({ code: 'ERR_INVALID_COORDINATE', message: `Invalid source coordinate: ${srcVal.errors.map(e => e.message).join('; ')}`, field: 'source.coordinate' });
    }
  }

  // 5. Destination address
  if (!envelope.destination || !envelope.destination.coordinate) {
    errors.push({ code: 'ERR_MISSING_DESTINATION', message: 'Missing destination address.', field: 'destination' });
  } else {
    const destVal = CubiONetworkCoordinateEngine.validate(envelope.destination.coordinate);
    if (!destVal.isValid) {
      errors.push({ code: 'ERR_INVALID_COORDINATE', message: `Invalid destination coordinate: ${destVal.errors.map(e => e.message).join('; ')}`, field: 'destination.coordinate' });
    }
  }

  // 6. Sender
  if (!envelope.sender || typeof envelope.sender !== 'object') {
    errors.push({ code: 'ERR_MISSING_SENDER', message: 'Missing sender principal.', field: 'sender' });
  } else {
    if (!envelope.sender.cubId || !CUB_ID_REGEX.test(envelope.sender.cubId)) {
      errors.push({ code: 'ERR_INVALID_SENDER_ID', message: `Sender cubId must match CUB-XXXXXXXX. Got '${envelope.sender.cubId}'.`, field: 'sender.cubId' });
    }
  }

  // 7. TTL
  if (typeof envelope.ttlMs !== 'number' || envelope.ttlMs <= 0) {
    errors.push({ code: 'ERR_INVALID_TTL', message: 'TTL must be a positive number.', field: 'ttlMs' });
  } else if (envelope.ttlMs > MAX_ENVELOPE_TTL_MS) {
    errors.push({ code: 'ERR_INVALID_TTL', message: `TTL ${envelope.ttlMs}ms exceeds maximum ${MAX_ENVELOPE_TTL_MS}ms.`, field: 'ttlMs' });
  }

  // 8. Expiry check
  if (typeof envelope.timestamp === 'number' && typeof envelope.ttlMs === 'number') {
    const expiresAt = envelope.timestamp + envelope.ttlMs;
    if (Date.now() > expiresAt) {
      errors.push({ code: 'ERR_ENVELOPE_EXPIRED', message: `Envelope expired at ${new Date(expiresAt).toISOString()}.`, field: 'timestamp+ttlMs' });
    }
  }

  // 9. Trace route length
  if (Array.isArray(envelope.traceRoute) && envelope.traceRoute.length > MAX_TRACE_HOPS) {
    errors.push({ code: 'ERR_TRACE_TOO_LONG', message: `Trace route has ${envelope.traceRoute.length} hops, max is ${MAX_TRACE_HOPS}.`, field: 'traceRoute' });
  }

  // 10. Payload
  if (!envelope.payload || typeof envelope.payload !== 'object') {
    errors.push({ code: 'ERR_INTERNAL', message: 'Missing payload.', field: 'payload' });
  } else {
    const p = envelope.payload;
    if (!VALID_PAYLOAD_CATEGORIES.has(p.category)) {
      errors.push({ code: 'ERR_INVALID_PAYLOAD_CATEGORY', message: `Unknown payload category '${p.category}'.`, field: 'payload.category' });
    }
    if (!VALID_PRIORITIES.has(p.priority)) {
      errors.push({ code: 'ERR_INTERNAL', message: `Unknown payload priority '${p.priority}'.`, field: 'payload.priority' });
    }
    if (!p.contentType || typeof p.contentType !== 'string') {
      errors.push({ code: 'ERR_INVALID_CONTENT_TYPE', message: 'Missing or invalid contentType.', field: 'payload.contentType' });
    }
    if (typeof p.bodyBytes === 'number' && p.bodyBytes > MAX_PAYLOAD_BYTES) {
      errors.push({ code: 'ERR_PAYLOAD_TOO_LARGE', message: `Payload size ${p.bodyBytes} bytes exceeds limit ${MAX_PAYLOAD_BYTES}.`, field: 'payload.bodyBytes' });
    }
  }

  // Loop detection
  if (Array.isArray(envelope.traceRoute) && envelope.source?.uri && envelope.destination?.uri) {
    const destinationInTrace = envelope.traceRoute.includes(envelope.destination.uri);
    if (destinationInTrace && envelope.traceRoute.length > 1) {
      errors.push({ code: 'ERR_LOOP_DETECTED', message: 'Destination URI already appears in trace route — routing loop detected.', field: 'traceRoute' });
    }
  }

  const valid = errors.length === 0;
  return Object.freeze({
    valid,
    errors: Object.freeze(errors),
    envelope: valid ? envelope as ProtocolEnvelope : undefined,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Public: Version Negotiation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parses "CNP/<major>.<minor>" into a ProtocolVersion.
 */
export function parseVersionString(versionStr: string): ProtocolVersion | null {
  const match = /^CNP\/(\d+)\.(\d+)$/.exec(versionStr.trim());
  if (!match) return null;
  return { major: parseInt(match[1], 10), minor: parseInt(match[2], 10) };
}

/**
 * Formats a ProtocolVersion to canonical string.
 */
export function formatVersionString(v: ProtocolVersion): string {
  return `CNP/${v.major}.${v.minor}`;
}

/**
 * Checks whether an incoming version string is compatible with this implementation.
 * Same major version is required; minor must be >= minimum.
 */
export function checkVersionCompatibility(versionStr: string): VersionHandshakeResult {
  const parsed = parseVersionString(versionStr);
  if (!parsed) {
    return { accepted: false, reason: `Cannot parse version string '${versionStr}'.` };
  }
  if (parsed.major !== PROTOCOL_VERSION.major) {
    return { accepted: false, reason: `Major version mismatch: expected ${PROTOCOL_VERSION.major}, got ${parsed.major}.` };
  }
  if (parsed.minor < MIN_COMPATIBLE_VERSION.minor) {
    return { accepted: false, reason: `Minor version ${parsed.minor} below minimum ${MIN_COMPATIBLE_VERSION.minor}.` };
  }
  return { accepted: true, negotiatedVersion: parsed };
}

/**
 * Processes a VERSION_HANDSHAKE payload and returns a negotiation result.
 */
export function negotiateVersion(handshake: VersionHandshakeBody): VersionHandshakeResult {
  // Find the best version from the offered list
  const compatible = handshake.offeredVersions
    .filter(v => v.major === PROTOCOL_VERSION.major && v.minor >= MIN_COMPATIBLE_VERSION.minor)
    .sort((a, b) => b.minor - a.minor); // prefer highest minor

  if (compatible.length === 0) {
    return {
      accepted: false,
      reason: `No compatible version offered. This node supports CNP/${PROTOCOL_VERSION.major}.${MIN_COMPATIBLE_VERSION.minor}+.`,
    };
  }

  return { accepted: true, negotiatedVersion: compatible[0] };
}

// ─────────────────────────────────────────────────────────────────────────────
// Public: Lifecycle Tracking
// ─────────────────────────────────────────────────────────────────────────────

/** Valid lifecycle state transitions. */
const VALID_TRANSITIONS: ReadonlyMap<EnvelopeLifecycleState, ReadonlySet<EnvelopeLifecycleState>> = new Map<EnvelopeLifecycleState, ReadonlySet<EnvelopeLifecycleState>>([
  ['CREATED',       new Set<EnvelopeLifecycleState>(['VALIDATED', 'REJECTED'])],
  ['VALIDATED',     new Set<EnvelopeLifecycleState>(['ROUTED', 'REJECTED'])],
  ['ROUTED',        new Set<EnvelopeLifecycleState>(['DELIVERED', 'UNROUTABLE', 'EXPIRED', 'RETRY'])],
  ['DELIVERED',     new Set<EnvelopeLifecycleState>(['ACKNOWLEDGED', 'EXPIRED'])],
  ['RETRY',         new Set<EnvelopeLifecycleState>(['ROUTED', 'REJECTED', 'EXPIRED'])],
  // Terminal states — no outgoing transitions
  ['ACKNOWLEDGED',  new Set<EnvelopeLifecycleState>()],
  ['REJECTED',      new Set<EnvelopeLifecycleState>()],
  ['UNROUTABLE',    new Set<EnvelopeLifecycleState>()],
  ['EXPIRED',       new Set<EnvelopeLifecycleState>()],
]);

/**
 * Creates a new lifecycle tracker for an envelope.
 */
export function createLifecycle(
  envelopeId: string,
  createdAt: number,
  ttlMs: number,
  maxRetries: number = 3,
): EnvelopeLifecycle {
  return Object.freeze({
    envelopeId,
    currentState: 'CREATED' as EnvelopeLifecycleState,
    transitions: Object.freeze([]),
    retryCount: 0,
    maxRetries,
    createdAt,
    expiresAt: createdAt + ttlMs,
  });
}

/**
 * Transitions an envelope lifecycle to a new state.
 * Returns a new frozen lifecycle object (immutable).
 * Throws if the transition is invalid.
 */
export function transitionLifecycle(
  lifecycle: EnvelopeLifecycle,
  to: EnvelopeLifecycleState,
  reason: string,
  nodeUri?: string,
): EnvelopeLifecycle {
  const allowedTargets = VALID_TRANSITIONS.get(lifecycle.currentState);
  if (!allowedTargets || !allowedTargets.has(to)) {
    throw new Error(
      `Invalid lifecycle transition: ${lifecycle.currentState} → ${to}. ` +
      `Allowed from ${lifecycle.currentState}: [${allowedTargets ? Array.from(allowedTargets).join(', ') : 'NONE'}].`
    );
  }

  const now = Date.now();

  // Auto-expire check
  if (now > lifecycle.expiresAt && to !== 'EXPIRED' && to !== 'REJECTED') {
    return transitionLifecycle(lifecycle, 'EXPIRED', 'TTL exceeded', nodeUri);
  }

  const newRetryCount = to === 'RETRY' ? lifecycle.retryCount + 1 : lifecycle.retryCount;

  // Enforce max retries
  if (to === 'RETRY' && newRetryCount > lifecycle.maxRetries) {
    return transitionLifecycle(lifecycle, 'EXPIRED', `Max retries (${lifecycle.maxRetries}) exceeded`, nodeUri);
  }

  const transition: LifecycleTransition = Object.freeze({
    from: lifecycle.currentState,
    to,
    reason,
    timestamp: now,
    nodeUri,
  });

  return Object.freeze({
    envelopeId: lifecycle.envelopeId,
    currentState: to,
    transitions: Object.freeze([...lifecycle.transitions, transition]),
    retryCount: newRetryCount,
    maxRetries: lifecycle.maxRetries,
    createdAt: lifecycle.createdAt,
    expiresAt: lifecycle.expiresAt,
  });
}

/**
 * Checks whether a lifecycle has reached a terminal state.
 */
export function isTerminalState(state: EnvelopeLifecycleState): boolean {
  const targets = VALID_TRANSITIONS.get(state);
  return !targets || targets.size === 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// Public: Trace Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Appends a hop to the trace route of an envelope.
 * Returns a new envelope (immutable) with the extended trace.
 */
export function appendTraceHop<T>(
  envelope: ProtocolEnvelope<T>,
  hopUri: string,
): ProtocolEnvelope<T> {
  if (envelope.traceRoute.length >= MAX_TRACE_HOPS) {
    throw new Error(`Cannot append trace hop: max ${MAX_TRACE_HOPS} hops reached.`);
  }
  return Object.freeze({
    ...envelope,
    traceRoute: Object.freeze([...envelope.traceRoute, hopUri]),
  });
}
