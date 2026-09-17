/**
 * CUBiO AI — Task 17: Native Mathematical Representation Layer
 * Phase 1 — Mathematical Core
 * src/cubio/math/serialization.ts
 *
 * Deterministic Canonical Serialization:
 * Guarantees that identical mathematical values yield identical byte sequences
 * regardless of runtime environment, insertion order, or property order.
 */

import { canonicalStringify } from '../core/canonicalIdentity';
import { NativeMathValue } from './types';
import { NativeMathValidationError } from './validation';

/**
 * Normalizes a number into a stable, locale-independent representation.
 * - Converts -0 to 0
 * - Rejects non-finite numbers
 */
export function formatCanonicalNumber(val: number): string {
  if (!Number.isFinite(val)) {
    throw new NativeMathValidationError(`Cannot canonically format non-finite number: ${val}`);
  }
  // Normalize -0 to 0
  if (Object.is(val, -0)) {
    return '0';
  }
  return JSON.stringify(val);
}

/**
 * Serializes any NativeMathValue into a bit-exact, lexicographically sorted canonical JSON string.
 */
export function serializeNativeMath(val: NativeMathValue): string {
  return canonicalStringify(val);
}

/**
 * Deserializes a canonical JSON string into a validated NativeMathValue.
 * Validates mathType field and throws NativeMathValidationError on corrupt payloads.
 */
export function deserializeNativeMath(canonicalJson: string): NativeMathValue {
  let parsed: unknown;
  try {
    parsed = JSON.parse(canonicalJson);
  } catch (err) {
    throw new NativeMathValidationError(`Failed to parse canonical JSON string: ${(err as Error).message}`);
  }

  if (typeof parsed !== 'object' || parsed === null) {
    throw new NativeMathValidationError('Deserialized payload must be a non-null object');
  }

  const obj = parsed as Record<string, unknown>;
  if (typeof obj.mathType !== 'string' || typeof obj.checksum !== 'string') {
    throw new NativeMathValidationError('Deserialized object lacks valid mathType or checksum fields');
  }

  return Object.freeze(obj) as unknown as NativeMathValue;
}
