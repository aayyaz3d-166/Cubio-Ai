/**
 * CUBiO Network Protocol v1 — Canonical Error and Response Model Types
 * ====================================================================
 *
 * Defines the formal response envelope, error taxonomy, classification,
 * status codes, and security sanitization specifications for the CUBiO
 * Network Protocol (CNP/1.0).
 *
 * ARCHITECTURAL DESIGN:
 *   - Universal wire response model encompassing both SUCCESS and ERROR states.
 *   - Every response deterministically binds to an originating request/message via correlationId.
 *   - Error taxonomy categorizes all failure modes into deterministic protocol categories.
 *   - Strict sanitization ensures internal stack traces, system paths, and credentials
 *     are stripped before responses are serialized or transmitted.
 *
 * INVARIANTS:
 *   1. All responses have status 'SUCCESS' or 'ERROR'.
 *   2. responseId is a deterministic content-addressable identifier: f(correlationId, timestamp, status).
 *   3. Error responses MUST contain a sanitized CanonicalProtocolError.
 *   4. Sensitive fields (passwords, tokens, private keys, stack traces, local paths) MUST NOT leak.
 *   5. Response structures are 100% compliant with RFC 8785 Canonical Serialization.
 */

/**
 * High-level error classification categories.
 */
export type ProtocolErrorCategory =
  | 'PROTOCOL_ERROR'    // Malformed frames, header errors, encoding/decoding violations
  | 'VALIDATION_ERROR'  // Schema constraint failures, out-of-bounds coordinates, size limits
  | 'VERSION_ERROR'     // Incompatible protocol versions, rejected handshakes, capability mismatches
  | 'NETWORK_ERROR'     // Future transport: connection dropped, timeout, route unreachable
  | 'SECURITY_ERROR'    // Unauthorized sovereign entity, signature failure, token expired
  | 'RATE_LIMIT_ERROR'  // Throttle exceeded, buffer/quota exhausted
  | 'INTERNAL_ERROR';   // Engine/subsystem internal exception (strictly sanitized)

/**
 * Standard HTTP-aligned numeric status codes for CUBiO responses.
 */
export const ResponseStatusCode = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  GONE: 410,
  PAYLOAD_TOO_LARGE: 413,
  UNPROCESSABLE_ENTITY: 422,
  UPGRADE_REQUIRED: 426,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

export type ResponseStatusCodeValue = typeof ResponseStatusCode[keyof typeof ResponseStatusCode];

/**
 * Canonical protocol error code catalog.
 */
export const ProtocolErrorCodeCatalog = {
  // Protocol Framing & Encoding
  ERR_PROTOCOL_MALFORMED_FRAME: 'ERR_PROTOCOL_MALFORMED_FRAME',
  ERR_PROTOCOL_MAGIC_MISMATCH: 'ERR_PROTOCOL_MAGIC_MISMATCH',
  ERR_PROTOCOL_UNSUPPORTED_KIND: 'ERR_PROTOCOL_UNSUPPORTED_KIND',
  ERR_PROTOCOL_SEQUENCE_VIOLATION: 'ERR_PROTOCOL_SEQUENCE_VIOLATION',
  ERR_PROTOCOL_TTL_EXPIRED: 'ERR_PROTOCOL_TTL_EXPIRED',
  ERR_PROTOCOL_MISSING_HEADER: 'ERR_PROTOCOL_MISSING_HEADER',
  ERR_PROTOCOL_TRACE_LIMIT_EXCEEDED: 'ERR_PROTOCOL_TRACE_LIMIT_EXCEEDED',
  ERR_PROTOCOL_SERIALIZATION_FAILED: 'ERR_PROTOCOL_SERIALIZATION_FAILED',
  ERR_PROTOCOL_CHECKSUM_MISMATCH: 'ERR_PROTOCOL_CHECKSUM_MISMATCH',

  // Validation
  ERR_VALIDATION_FAILED: 'ERR_VALIDATION_FAILED',
  ERR_VALIDATION_INVALID_COORDINATE: 'ERR_VALIDATION_INVALID_COORDINATE',
  ERR_VALIDATION_INVALID_SENDER_ID: 'ERR_VALIDATION_INVALID_SENDER_ID',
  ERR_VALIDATION_PAYLOAD_TOO_LARGE: 'ERR_VALIDATION_PAYLOAD_TOO_LARGE',
  ERR_VALIDATION_INVALID_CATEGORY: 'ERR_VALIDATION_INVALID_CATEGORY',
  ERR_VALIDATION_INVALID_PRIORITY: 'ERR_VALIDATION_INVALID_PRIORITY',
  ERR_VALIDATION_MISSING_REQUIRED_FIELD: 'ERR_VALIDATION_MISSING_REQUIRED_FIELD',
  ERR_VALIDATION_SCHEMA_VIOLATION: 'ERR_VALIDATION_SCHEMA_VIOLATION',

  // Versioning
  ERR_VERSION_INCOMPATIBLE: 'ERR_VERSION_INCOMPATIBLE',
  ERR_VERSION_DEPRECATED: 'ERR_VERSION_DEPRECATED',
  ERR_VERSION_TOO_NEW: 'ERR_VERSION_TOO_NEW',
  ERR_VERSION_NO_COMPATIBLE: 'ERR_VERSION_NO_COMPATIBLE',
  ERR_VERSION_INVALID_FORMAT: 'ERR_VERSION_INVALID_FORMAT',
  ERR_VERSION_CAPABILITY_MISMATCH: 'ERR_VERSION_CAPABILITY_MISMATCH',

  // Future Network & Transport
  ERR_NETWORK_DESTINATION_UNREACHABLE: 'ERR_NETWORK_DESTINATION_UNREACHABLE',
  ERR_NETWORK_CONNECTION_REFUSED: 'ERR_NETWORK_CONNECTION_REFUSED',
  ERR_NETWORK_CONNECTION_RESET: 'ERR_NETWORK_CONNECTION_RESET',
  ERR_NETWORK_CONNECTION_TIMEOUT: 'ERR_NETWORK_CONNECTION_TIMEOUT',
  ERR_NETWORK_PEER_DISCONNECTED: 'ERR_NETWORK_PEER_DISCONNECTED',
  ERR_NETWORK_HANDSHAKE_FAILED: 'ERR_NETWORK_HANDSHAKE_FAILED',
  ERR_NETWORK_ROUTING_LOOP: 'ERR_NETWORK_ROUTING_LOOP',
  ERR_NETWORK_BUFFER_OVERFLOW: 'ERR_NETWORK_BUFFER_OVERFLOW',

  // Security & Authorization
  ERR_SECURITY_UNAUTHORIZED_IDENTITY: 'ERR_SECURITY_UNAUTHORIZED_IDENTITY',
  ERR_SECURITY_INVALID_SIGNATURE: 'ERR_SECURITY_INVALID_SIGNATURE',
  ERR_SECURITY_TOKEN_EXPIRED: 'ERR_SECURITY_TOKEN_EXPIRED',
  ERR_SECURITY_FORBIDDEN_CAPABILITY: 'ERR_SECURITY_FORBIDDEN_CAPABILITY',
  ERR_SECURITY_REPLAY_DETECTED: 'ERR_SECURITY_REPLAY_DETECTED',

  // Rate Limiting & Capacity
  ERR_RATE_LIMIT_EXCEEDED: 'ERR_RATE_LIMIT_EXCEEDED',
  ERR_STORAGE_QUOTA_EXHAUSTED: 'ERR_STORAGE_QUOTA_EXHAUSTED',

  // Internal & Fallback
  ERR_INTERNAL_ERROR: 'ERR_INTERNAL_ERROR',
  ERR_NOT_IMPLEMENTED: 'ERR_NOT_IMPLEMENTED',
} as const;

export type ProtocolErrorCodeCatalogValue =
  typeof ProtocolErrorCodeCatalog[keyof typeof ProtocolErrorCodeCatalog];

/**
 * Structured, sanitized protocol error.
 */
export interface CanonicalProtocolError {
  /** High-level classification */
  readonly category: ProtocolErrorCategory;
  /** Specific error code token */
  readonly code: string;
  /** Sanitized human-readable error description */
  readonly message: string;
  /** Sanitized diagnostic details (optional) */
  readonly details?: Readonly<Record<string, unknown>>;
  /** Indicates whether the originating operation can be retried safely */
  readonly retryable: boolean;
  /** Recommended backoff before retry in milliseconds (if retryable) */
  readonly retryAfterMs?: number;
}

/**
 * Canonical success response frame.
 */
export interface CubiOSuccessResponse<T = unknown> {
  readonly status: 'SUCCESS';
  /** Deterministic response identifier (e.g. "RSP_0x...") */
  readonly responseId: string;
  /** Originating message ID, envelope ID, or packet ID */
  readonly correlationId: string;
  /** Milliseconds since epoch */
  readonly timestamp: number;
  /** Standard numeric status code (200, 201, etc.) */
  readonly statusCode: number;
  /** Response payload data */
  readonly payload: T;
  /** Optional metadata tags */
  readonly metadata?: Readonly<Record<string, unknown>>;
}

/**
 * Canonical error response frame.
 */
export interface CubiOErrorResponse {
  readonly status: 'ERROR';
  /** Deterministic response identifier (e.g. "RSP_0x...") */
  readonly responseId: string;
  /** Originating message ID, envelope ID, or packet ID */
  readonly correlationId: string;
  /** Milliseconds since epoch */
  readonly timestamp: number;
  /** Standard numeric status code (400, 404, 500, etc.) */
  readonly statusCode: number;
  /** Structured canonical error detail */
  readonly error: CanonicalProtocolError;
  /** Optional metadata tags */
  readonly metadata?: Readonly<Record<string, unknown>>;
}

/**
 * Unified response envelope type.
 */
export type CubiOResponse<T = unknown> = CubiOSuccessResponse<T> | CubiOErrorResponse;

/**
 * Options for constructing success responses.
 */
export interface SuccessResponseOptions {
  readonly statusCode?: number;
  readonly timestamp?: number;
  readonly metadata?: Record<string, unknown>;
  readonly responseId?: string;
}

/**
 * Options for constructing error responses.
 */
export interface ErrorResponseOptions {
  readonly statusCode?: number;
  readonly timestamp?: number;
  readonly details?: Record<string, unknown>;
  readonly retryable?: boolean;
  readonly retryAfterMs?: number;
  readonly metadata?: Record<string, unknown>;
  readonly responseId?: string;
}

/**
 * Result of validating a CubiOResponse structure.
 */
export interface ResponseValidationResult {
  readonly isValid: boolean;
  readonly errors: readonly string[];
}
