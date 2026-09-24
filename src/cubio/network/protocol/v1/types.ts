/**
 * CUBiO Network Protocol Specification — v1 Canonical Types
 * ============================================================
 *
 * This file defines the authoritative protocol primitives for the CUBiO
 * Network Protocol v1 (CNP/1).  Every network message exchanged between
 * CUBiO nodes, services, and clients MUST conform to these types.
 *
 * PROTOCOL LAYERS (bottom-up):
 * ───────────────────────────────────────────────────────────
 *   L0 — Addressing     CNC coordinates (reuse NET-00 CubiONetworkCoordinate)
 *   L1 — Identity       Sender/receiver CUB-XXXXXXXX + signature
 *   L2 — Envelope       Protocol envelope (version, id, timestamp, TTL, trace)
 *   L3 — Payload        Typed message body (content, metadata)
 *   L4 — Lifecycle      Delivery status, acknowledgements, retries
 *
 * VERSIONING:
 *   Major.Minor — breaking changes increment Major; additive changes increment Minor.
 *   Current: 1.0
 *
 * INVARIANTS:
 *   1. Every envelope MUST carry a valid L0 source and destination coordinate.
 *   2. Every envelope MUST carry an L1 sender identity (cubId).
 *   3. Envelope IDs are deterministic: f(source, dest, nonce, timestamp).
 *   4. Protocol version MUST be negotiated before payload exchange.
 *   5. Messages with unknown Major versions MUST be rejected.
 *   6. Messages exceeding MAX_PAYLOAD_BYTES MUST be rejected.
 *   7. Expired envelopes (ttl exceeded) MUST be discarded, never delivered.
 */

// Re-export verified upstream types used by the protocol
import type { CubiONetworkCoordinate, CubiOServiceIdentifier } from '../../coordinate/types';

// ─────────────────────────────────────────────────────────────────────────────
// L0 — Addressing Layer
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A resolved endpoint address.  Wraps the existing CNC coordinate with an
 * optional human-readable label.
 */
export interface ProtocolAddress {
  /** CNC coordinate (CUBIO://NETWORK/<dim>/<zone>/<node>/<service>) */
  readonly coordinate: CubiONetworkCoordinate;
  /** Pre-serialized canonical URI for fast equality checks */
  readonly uri: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// L1 — Identity Layer
// ─────────────────────────────────────────────────────────────────────────────

/** Entity class that may originate or receive protocol messages. */
export type ProtocolEntityType = 'USER' | 'AGENT' | 'SERVICE' | 'DEVICE' | 'NODE';

/** Principal identity attached to every protocol envelope. */
export interface ProtocolPrincipal {
  /** Sovereign CUBiO identity (CUB-XXXXXXXX format) */
  readonly cubId: string;
  /** Entity classification */
  readonly entityType: ProtocolEntityType;
  /** Deterministic HMAC signature over the envelope body (hex string) */
  readonly signature: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// L2 — Envelope Layer
// ─────────────────────────────────────────────────────────────────────────────

/** Protocol version tuple. */
export interface ProtocolVersion {
  readonly major: number;
  readonly minor: number;
}

/** Canonical string form of the current protocol version. */
export const PROTOCOL_VERSION_STRING = 'CNP/1.0' as const;

/** Current protocol version object. */
export const PROTOCOL_VERSION: Readonly<ProtocolVersion> = Object.freeze({
  major: 1,
  minor: 0,
});

/** Minimum protocol version this implementation can accept. */
export const MIN_COMPATIBLE_VERSION: Readonly<ProtocolVersion> = Object.freeze({
  major: 1,
  minor: 0,
});

/** Hard limits — reject any envelope exceeding these. */
export const MAX_PAYLOAD_BYTES = 65_536;     // 64 KB
export const MAX_ENVELOPE_TTL_MS = 300_000;  // 5 minutes
export const DEFAULT_ENVELOPE_TTL_MS = 30_000; // 30 seconds
export const MAX_TRACE_HOPS = 16;

/** Envelope classifications. */
export type EnvelopeKind =
  | 'REQUEST'
  | 'RESPONSE'
  | 'EVENT'
  | 'ACK'
  | 'NACK'
  | 'PING'
  | 'PONG'
  | 'VERSION_NEGOTIATE';

/**
 * The protocol envelope — the atomic unit of communication in CNP/1.
 * Every message, acknowledgement, or control frame is wrapped in this envelope.
 */
export interface ProtocolEnvelope<T = unknown> {
  // ── Header ──
  /** Protocol version (e.g. "CNP/1.0") */
  readonly protocolVersion: string;
  /** Globally unique envelope identifier (deterministic) */
  readonly envelopeId: string;
  /** Envelope classification */
  readonly kind: EnvelopeKind;
  /** Correlation ID linking request-response pairs */
  readonly correlationId?: string;
  /** Monotonic creation timestamp (ms since epoch) */
  readonly timestamp: number;
  /** Time-to-live in milliseconds; the envelope MUST be discarded after expiry */
  readonly ttlMs: number;
  /** Hop trace — each node that forwards the envelope appends its URI */
  readonly traceRoute: readonly string[];

  // ── L0 — Addressing ──
  readonly source: ProtocolAddress;
  readonly destination: ProtocolAddress;

  // ── L1 — Identity ──
  readonly sender: ProtocolPrincipal;

  // ── L3 — Payload ──
  /** Typed message payload */
  readonly payload: ProtocolPayload<T>;
}

// ─────────────────────────────────────────────────────────────────────────────
// L3 — Payload Layer
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Message categories that define routing behaviour and validation rules.
 * Reuses concepts from existing messaging/types.ts where applicable.
 */
export type PayloadCategory =
  // Conversational
  | 'DIRECT_MESSAGE'
  | 'CHANNEL_BROADCAST'
  // RPC / Service
  | 'RPC_REQUEST'
  | 'RPC_RESPONSE'
  // State Synchronisation
  | 'STATE_DELTA'
  | 'STATE_SNAPSHOT'
  // System / Control
  | 'SYSTEM_NOTIFICATION'
  | 'HEALTH_CHECK'
  | 'VERSION_HANDSHAKE'
  // File
  | 'FILE_TRANSFER_INIT'
  | 'FILE_CHUNK'
  | 'FILE_TRANSFER_COMPLETE';

/**
 * Priority levels that affect queue ordering and TTL defaults.
 * Aligns with existing MessagePriority from messaging/types.ts.
 */
export type PayloadPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

/**
 * Structured payload wrapper.
 */
export interface ProtocolPayload<T = unknown> {
  /** Message category for routing / validation dispatch */
  readonly category: PayloadCategory;
  /** Priority for queue ordering */
  readonly priority: PayloadPriority;
  /** MIME-like content type (e.g. "application/json", "application/octet-stream") */
  readonly contentType: string;
  /** Typed body */
  readonly body: T;
  /** Size of serialized body in bytes (validated against MAX_PAYLOAD_BYTES) */
  readonly bodyBytes: number;
  /** Optional key-value metadata */
  readonly metadata?: Readonly<Record<string, string>>;
}

// ─────────────────────────────────────────────────────────────────────────────
// L4 — Lifecycle Layer
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Message lifecycle states.
 *
 * State machine:
 *
 *   CREATED ──▶ VALIDATED ──▶ ROUTED ──▶ DELIVERED ──▶ ACKNOWLEDGED
 *      │            │            │            │
 *      ▼            ▼            ▼            ▼
 *   REJECTED    REJECTED    UNROUTABLE   EXPIRED
 *                                         │
 *                                    RETRY (up to maxRetries)
 */
export type EnvelopeLifecycleState =
  | 'CREATED'
  | 'VALIDATED'
  | 'ROUTED'
  | 'DELIVERED'
  | 'ACKNOWLEDGED'
  | 'REJECTED'
  | 'UNROUTABLE'
  | 'EXPIRED'
  | 'RETRY';

/** A lifecycle transition record for audit/tracing. */
export interface LifecycleTransition {
  readonly from: EnvelopeLifecycleState;
  readonly to: EnvelopeLifecycleState;
  readonly reason: string;
  readonly timestamp: number;
  readonly nodeUri?: string;
}

/** Full lifecycle tracker attached to an envelope in transit. */
export interface EnvelopeLifecycle {
  readonly envelopeId: string;
  readonly currentState: EnvelopeLifecycleState;
  readonly transitions: readonly LifecycleTransition[];
  readonly retryCount: number;
  readonly maxRetries: number;
  readonly createdAt: number;
  readonly expiresAt: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Error Codes
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Canonical error codes returned in NACK envelopes or validation results.
 */
export type ProtocolErrorCode =
  // Validation errors
  | 'ERR_INVALID_VERSION'
  | 'ERR_VERSION_INCOMPATIBLE'
  | 'ERR_MISSING_ENVELOPE_ID'
  | 'ERR_MISSING_SOURCE'
  | 'ERR_MISSING_DESTINATION'
  | 'ERR_MISSING_SENDER'
  | 'ERR_INVALID_COORDINATE'
  | 'ERR_INVALID_SENDER_ID'
  | 'ERR_PAYLOAD_TOO_LARGE'
  | 'ERR_INVALID_PAYLOAD_CATEGORY'
  | 'ERR_INVALID_CONTENT_TYPE'
  | 'ERR_INVALID_TTL'
  | 'ERR_ENVELOPE_EXPIRED'
  | 'ERR_TRACE_TOO_LONG'
  // Routing errors
  | 'ERR_DESTINATION_UNREACHABLE'
  | 'ERR_LOOP_DETECTED'
  // Auth errors
  | 'ERR_SIGNATURE_INVALID'
  | 'ERR_SENDER_UNAUTHORIZED'
  // Generic
  | 'ERR_INTERNAL';

/**
 * Structured protocol error.
 */
export interface ProtocolError {
  readonly code: ProtocolErrorCode;
  readonly message: string;
  readonly field?: string;
  readonly envelopeId?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Validation Result
// ─────────────────────────────────────────────────────────────────────────────

export interface EnvelopeValidationResult {
  readonly valid: boolean;
  readonly errors: readonly ProtocolError[];
  readonly envelope?: ProtocolEnvelope;
}

// ─────────────────────────────────────────────────────────────────────────────
// Version Negotiation
// ─────────────────────────────────────────────────────────────────────────────

export interface VersionHandshakeBody {
  readonly offeredVersions: readonly ProtocolVersion[];
  readonly preferredVersion: ProtocolVersion;
  readonly implementationId: string;
}

export interface VersionHandshakeResult {
  readonly accepted: boolean;
  readonly negotiatedVersion?: ProtocolVersion;
  readonly reason?: string;
}
