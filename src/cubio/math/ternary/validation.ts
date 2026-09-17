/**
 * CUBiO AI — Task 18: Native 369 / Ternary Encoding Layer
 * Phase 1 — Mathematical Core
 * src/cubio/math/ternary/validation.ts
 *
 * Strict validation and corruption detection for ternary and 369 symbols:
 * - Reject non-trit numbers (!= 0, 1, 2)
 * - Reject non-369 symbols (!= '3', '6', '9')
 * - Reject byte values outside [0..255]
 * - Reject decoded values >= 256 (corrupt 6-trit permutations in [256..728])
 * - Reject non-multiple-of-6 stream lengths
 */

import {
  MAX_BYTE_VALUE,
  RADIX_3_POWER_6,
  TRITS_PER_BYTE,
  TritSymbol,
  TritValue,
} from './types';

export class TernaryEncodingError extends Error {
  constructor(message: string) {
    super(`[TERNARY_ENCODING_ERROR] ${message}`);
    this.name = 'TernaryEncodingError';
  }
}

/**
 * Asserts that a value is a valid numeric base-3 trit (0, 1, or 2).
 */
export function assertTrit(val: number, context = 'Trit'): asserts val is TritValue {
  if (!Number.isInteger(val) || (val !== 0 && val !== 1 && val !== 2)) {
    throw new TernaryEncodingError(
      `${context} must be an integer trit in {0, 1, 2}. Received: ${val}`
    );
  }
}

/**
 * Asserts that a character is a valid 369 symbol ('3', '6', or '9').
 */
export function assertTritSymbol(sym: string, context = 'Symbol'): asserts sym is TritSymbol {
  if (sym !== '3' && sym !== '6' && sym !== '9') {
    throw new TernaryEncodingError(
      `${context} must be one of {'3', '6', '9'}. Received: '${sym}'`
    );
  }
}

/**
 * Asserts that a value is an 8-bit unsigned integer byte in [0..255].
 */
export function assertByte(val: number, context = 'Byte'): void {
  if (!Number.isInteger(val) || val < 0 || val > MAX_BYTE_VALUE) {
    throw new TernaryEncodingError(
      `${context} must be an integer in range [0..255]. Received: ${val}`
    );
  }
}

/**
 * Validates that a decoded 6-trit value does not exceed the 8-bit byte boundary.
 * 6 trits allow values up to 3^6 - 1 = 728. Values in [256..728] are out of range.
 */
export function assertDecodedByteRange(val: number, context = 'Decoded 6-trit value'): void {
  if (!Number.isInteger(val) || val < 0 || val >= RADIX_3_POWER_6) {
    throw new TernaryEncodingError(
      `${context} must be in range [0..${RADIX_3_POWER_6 - 1}]. Received: ${val}`
    );
  }
  if (val > MAX_BYTE_VALUE) {
    throw new TernaryEncodingError(
      `${context} (${val}) exceeds maximum 8-bit byte value (${MAX_BYTE_VALUE}). Corrupt 6-trit sequence in [256..728].`
    );
  }
}

/**
 * Asserts that a trit stream has a valid length that is an exact multiple of 6.
 */
export function assertTritStreamLength(length: number): void {
  if (!Number.isInteger(length) || length < 0) {
    throw new TernaryEncodingError(`Stream length must be a non-negative integer. Received: ${length}`);
  }
  if (length % TRITS_PER_BYTE !== 0) {
    throw new TernaryEncodingError(
      `Stream length (${length}) must be an exact multiple of ${TRITS_PER_BYTE} trits per byte.`
    );
  }
}

/**
 * Asserts that a symbol string contains only '3', '6', or '9' and has length multiple of 6.
 */
export function assertSymbolString(str: string): void {
  if (typeof str !== 'string') {
    throw new TernaryEncodingError(`Symbol payload must be a string. Received: ${typeof str}`);
  }
  assertTritStreamLength(str.length);
  for (let i = 0; i < str.length; i++) {
    const c = str[i];
    if (c !== '3' && c !== '6' && c !== '9') {
      throw new TernaryEncodingError(
        `Invalid character at index ${i}: '${c}'. Only symbols '3', '6', and '9' are permitted.`
      );
    }
  }
}
