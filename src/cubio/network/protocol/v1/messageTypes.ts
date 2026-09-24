/**
 * CUBiO Network Protocol v1 — Canonical Message Model Types
 * ============================================================
 *
 * Defines the application-level message primitives for the CUBiO Network Protocol (CNP/1.0).
 * Messages represent meaningful application and service interactions (conversations, RPCs,
 * agent deductions, state updates) that exist above the packet/envelope transmission layers.
 *
 * PROTOCOL HIERARCHY:
 *   CubiOMessage (Task 03)
 *        │  messageToEnvelope()
 *        ▼
 *   ProtocolEnvelope (Task 01)
 *        │  packetizeEnvelope()
 *        ▼
 *   CubiOPacket[] (Task 02)
 *
 * INVARIANTS:
 *   1. All messages must originate from a verified sovereign identity (CUB-XXXXXXXX).
 *   2. Sender and receiver must reference valid CNC coordinates (CUBIO://NETWORK/...).
 *   3. Message IDs are deterministic: f(senderCubId, destUri, timestamp, nonce).
 *   4. Lifecycle transitions are strictly enforced and monotonic.
 *   5. Total message payload size must not exceed MAX_MESSAGE_PAYLOAD_BYTES (65,536 bytes).
 */

import { ProtocolEntityType } from './types';

/** Maximum payload size for an individual application message */
export const MAX_MESSAGE_PAYLOAD_BYTES = 65_536; // 64 KB

/** Default message expiration window (5 minutes) */
export const DEFAULT_MESSAGE_TTL_MS = 300_000;

/**
 * Functional message types.
 */
export type CanonicalMessageType =
  | 'DIRECT'              // One-to-one communication
  | 'CHANNEL_BROADCAST'   // Topic / room broadcast
  | 'SYSTEM_NOTICE'       // System warning, notification, or alert
  | 'SPATIAL_EVENT'       // 3D coordinate / state update event
  | 'RPC_REQUEST'         // Remote procedure call request
  | 'RPC_RESPONSE'        // Correlated remote procedure call response
  | 'AGENT_PROMPT'        // AI agent deduction prompt
  | 'AGENT_RESPONSE';     // AI agent reasoning / conclusion output

/**
 * Communication participant modes.
 */
export type MessageCommunicationMode =
  | 'USER_USER'
  | 'USER_AGENT'
  | 'USER_SERVICE'
  | 'AGENT_AGENT'
  | 'SERVICE_SERVICE';

/**
 * Message delivery priorities.
 */
export type MessagePriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

/**
 * Message lifecycle states.
 *
 * State machine:
 *   DRAFT ──▶ QUEUED ──▶ IN_TRANSIT ──▶ DELIVERED ──▶ READ
 *     │          │            │             │
 *     ▼          ▼            ▼             ▼
 *  REJECTED   REJECTED      FAILED       EXPIRED
 */
export type MessageLifecycleState =
  | 'DRAFT'
  | 'QUEUED'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'READ'
  | 'REJECTED'
  | 'FAILED'
  | 'EXPIRED';

/**
 * Source endpoint description.
 */
export interface MessageEndpointSource {
  /** Sovereign identity (CUB-XXXXXXXX) */
  readonly cubId: string;
  /** Canonical CNC coordinate URI */
  readonly coordinateUri: string;
  /** Entity classification */
  readonly entityType: ProtocolEntityType;
  /** Optional human-readable display label */
  readonly displayName?: string;
}

/**
 * Destination endpoint description.
 */
export interface MessageEndpointDestination {
  /** Canonical CNC coordinate URI */
  readonly coordinateUri: string;
  /** Optional direct recipient sovereign identity (CUB-XXXXXXXX) */
  readonly recipientCubId?: string;
  /** Optional channel / topic identifier for broadcasts */
  readonly channelId?: string;
}

/**
 * Content payload container for application messages.
 */
export interface MessagePayload<T = unknown> {
  /** MIME content type (e.g. 'application/json', 'text/plain') */
  readonly contentType: string;
  /** Typed message body */
  readonly body: T;
  /** Byte length of serialized payload */
  readonly byteLength: number;
  /** Deterministic content hash of body */
  readonly contentHash: string;
  /** Optional schema URI defining structure */
  readonly schemaUri?: string;
}

/**
 * Timestamps tracking the message's lifecycle.
 */
export interface MessageTimestamps {
  /** Timestamp when message object was constructed (epoch ms) */
  readonly createdAt: number;
  /** Timestamp when message was dispatched (epoch ms) */
  readonly sentAt?: number;
  /** Timestamp when message arrived at destination (epoch ms) */
  readonly deliveredAt?: number;
  /** Timestamp when message was read / consumed (epoch ms) */
  readonly readAt?: number;
  /** Timestamp after which message MUST be considered expired */
  readonly expiresAt: number;
}

/**
 * Canonical CUBiO Message.
 * The core application-level communication unit.
 */
export interface CubiOMessage<T = unknown> {
  /** Protocol schema version (e.g. "CNP/1.0") */
  readonly protocolVersion: string;
  /** Globally unique deterministic message ID (e.g. "MSG_0x...") */
  readonly messageId: string;
  /** Optional conversation or thread grouping identifier */
  readonly conversationId?: string;
  /** Optional correlation ID referencing an antecedent message */
  readonly correlationId?: string;
  /** Message classification */
  readonly type: CanonicalMessageType;
  /** Interaction mode */
  readonly communicationMode: MessageCommunicationMode;
  /** Priority level */
  readonly priority: MessagePriority;
  /** Current lifecycle state */
  readonly state: MessageLifecycleState;
  /** Source endpoint */
  readonly source: MessageEndpointSource;
  /** Destination endpoint */
  readonly destination: MessageEndpointDestination;
  /** Optional subject line / headline */
  readonly subject?: string;
  /** Typed payload */
  readonly payload: MessagePayload<T>;
  /** Key-value metadata annotations */
  readonly metadata: Readonly<Record<string, string>>;
  /** Cryptographic / deterministic signature proof */
  readonly signature: string;
  /** Monotonic lifecycle timestamps */
  readonly timestamps: MessageTimestamps;
  /** Trace hops visited by this message */
  readonly traceRoute: readonly string[];
}

/**
 * Message validation error codes.
 */
export type MessageErrorCode =
  | 'ERR_INVALID_VERSION'
  | 'ERR_INVALID_MESSAGE_ID'
  | 'ERR_INVALID_SOURCE'
  | 'ERR_INVALID_DESTINATION'
  | 'ERR_INVALID_TYPE'
  | 'ERR_INVALID_MODE'
  | 'ERR_INVALID_PRIORITY'
  | 'ERR_INVALID_STATE'
  | 'ERR_PAYLOAD_TOO_LARGE'
  | 'ERR_PAYLOAD_HASH_MISMATCH'
  | 'ERR_PAYLOAD_MISSING'
  | 'ERR_SIGNATURE_MISSING'
  | 'ERR_TIMESTAMPS_INCONSISTENT'
  | 'ERR_MESSAGE_EXPIRED'
  | 'ERR_MALFORMED_STRUCTURE';

/**
 * Structured message validation error.
 */
export interface MessageValidationError {
  readonly code: MessageErrorCode;
  readonly message: string;
  readonly field?: string;
}

/**
 * Validation result for messages.
 */
export interface MessageValidationResult {
  readonly valid: boolean;
  readonly errors: readonly MessageValidationError[];
  readonly message?: CubiOMessage;
}

/**
 * Options for constructing a new message.
 */
export interface CreateMessageOptions<T = unknown> {
  readonly type: CanonicalMessageType;
  readonly communicationMode: MessageCommunicationMode;
  readonly source: MessageEndpointSource;
  readonly destination: MessageEndpointDestination;
  readonly body: T;
  readonly contentType?: string;
  readonly conversationId?: string;
  readonly correlationId?: string;
  readonly priority?: MessagePriority;
  readonly subject?: string;
  readonly metadata?: Record<string, string>;
  readonly ttlMs?: number;
  readonly nonce?: string;
  readonly signature?: string;
  readonly schemaUri?: string;
}
