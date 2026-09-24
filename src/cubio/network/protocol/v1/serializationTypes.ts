/**
 * CUBiO Network Protocol v1 — Canonical Serialization Types
 * ============================================================
 *
 * Types and error definitions for deterministic RFC 8785 (JCS) canonical
 * serialization, decoding, and corruption detection across all protocol primitives.
 *
 * INVARIANTS:
 *   1. Equivalent objects MUST produce identical byte-for-byte canonical output.
 *   2. Lexicographical key sorting is enforced recursively at all object depths.
 *   3. All extraneous whitespace is omitted.
 *   4. Circular references, Functions, Symbols, NaN, and +/-Infinity are strictly rejected.
 *   5. Serialization output is a wire format definition, NOT proof of physical transmission.
 */

import { CubiOPacket } from './packetTypes';
import { CubiOMessage } from './messageTypes';
import { ProtocolEnvelope, ProtocolAddress } from './types';
import { CanonicalNodeConfig } from './nodeTypes';
import { CanonicalNetworkStateSnapshot } from './stateTypes';

/**
 * Protocol object classes supporting canonical serialization.
 */
export type CanonicalSerializableObject =
  | CubiOPacket
  | CubiOMessage
  | ProtocolEnvelope
  | ProtocolAddress
  | CanonicalNodeConfig
  | CanonicalNetworkStateSnapshot;

/**
 * Serialization error codes.
 */
export type SerializationErrorCode =
  | 'ERR_CIRCULAR_REFERENCE'
  | 'ERR_UNSUPPORTED_TYPE'
  | 'ERR_NON_FINITE_NUMBER'
  | 'ERR_MALFORMED_JSON'
  | 'ERR_NON_CANONICAL_ENCODING'
  | 'ERR_CORRUPTED_PAYLOAD'
  | 'ERR_CHECKSUM_VERIFICATION_FAILED'
  | 'ERR_SCHEMA_VALIDATION_FAILED';

/**
 * Structured serialization error.
 */
export interface SerializationError {
  readonly code: SerializationErrorCode;
  readonly message: string;
  readonly path?: string;
}

/**
 * Result of serialization validation.
 */
export interface SerializationValidationResult<T = unknown> {
  readonly valid: boolean;
  readonly value?: T;
  readonly errors: readonly SerializationError[];
}
