/**
 * CUBiO Network Protocol v1 — Central Protocol Validation Layer Types
 * ===================================================================
 *
 * Defines the formal validation outcomes, error structures, object type
 * classifiers, and configuration options for the centralized CUBiO
 * Protocol Validator.
 *
 * ARCHITECTURAL PURPOSE:
 *   - Serves as the authoritative single gatekeeper verifying that every
 *     inbound, outbound, or deserialized protocol object strictly adheres
 *     to canonical protocol invariants (CNP/1.0).
 *   - Enforces fail-closed semantics: any malformed, ambiguous, corrupted,
 *     or out-of-range object is deterministically rejected.
 *
 * INVARIANTS:
 *   1. Validation is pure-function and deterministic (σ² = 0).
 *   2. Validation failure is non-recoverable without correcting the source data.
 *   3. Passing validation does NOT imply active network transport or connection state.
 */

import { ProtocolErrorCategory } from './responseTypes';
import { CubiOPacket } from './packetTypes';
import { CubiOMessage } from './messageTypes';
import { ProtocolEnvelope } from './types';
import { CanonicalNodeConfig } from './nodeTypes';
import { CanonicalProtocolVersion } from './versionTypes';
import { CanonicalNetworkStateSnapshot } from './stateTypes';
import { CubiOResponse } from './responseTypes';

/**
 * Supported protocol object classifications.
 */
export type ProtocolObjectType =
  | 'PACKET'
  | 'MESSAGE'
  | 'ENVELOPE'
  | 'NODE_METADATA'
  | 'VERSION'
  | 'STATE_SNAPSHOT'
  | 'RESPONSE';

/**
 * Severity of validation findings.
 */
export type ValidationErrorSeverity = 'FATAL' | 'ERROR' | 'WARNING';

/**
 * Fine-grained validation failure descriptor.
 */
export interface StructuredValidationError {
  /** Machine-readable error code */
  readonly code: string;
  /** Human-readable explanation of the validation failure */
  readonly message: string;
  /** Object field or path where the failure occurred (e.g. "header.ttl", "payload.bodyBytes") */
  readonly path: string;
  /** Protocol error category mapping */
  readonly category: ProtocolErrorCategory;
  /** The illegal value encountered (if safe to include) */
  readonly received?: unknown;
  /** Expected constraint or boundary description */
  readonly expected?: string;
}

/**
 * Immutable outcome of a protocol validation pass.
 */
export interface ValidationOutcome<T = unknown> {
  /** True strictly if the object satisfies all protocol invariants */
  readonly isValid: boolean;
  /** Identified protocol object type */
  readonly objectType?: ProtocolObjectType;
  /** List of validation errors encountered (empty if isValid is true) */
  readonly errors: readonly StructuredValidationError[];
  /** Non-blocking warning messages */
  readonly warnings: readonly string[];
  /** The validated object, typed and frozen upon successful validation */
  readonly validatedObject?: T;
  /** Content-addressable hash of the validated object (if valid) */
  readonly canonicalChecksum?: string;
}

/**
 * Options configuring validation strictness and checks.
 */
export interface ValidationOptions {
  /**
   * If true, reject objects containing unexpected extra properties.
   * Default: true (strict closed schema).
   */
  readonly strictProperties?: boolean;
  /**
   * If true, perform cryptographic / deterministic checksum verification
   * on packets, messages, and snapshots.
   * Default: true.
   */
  readonly verifyChecksums?: boolean;
  /**
   * If true, verify that the object obeys RFC 8785 canonical serialization encoding.
   * Default: false (unless validating serialized strings).
   */
  readonly enforceCanonicalEncoding?: boolean;
  /**
   * Maximum allowed payload byte size override (must be <= MAX_PACKET_BYTES).
   */
  readonly maxPayloadBytes?: number;
}
