/**
 * CUBiO AI — Task 18: Native 369 / Ternary Encoding Layer
 * Phase 1 — Mathematical Core
 * src/cubio/math/ternary/codec.ts
 *
 * Deterministic Native 369 / Ternary Codec:
 * - Minimum 6-trit byte decomposition (3^6 = 729 >= 256)
 * - Exact bijective mapping: 0 <-> '3', 1 <-> '6', 2 <-> '9'
 * - Byte array and UTF-8 string encoding/decoding
 * - Bounded validation and corrupt sequence rejection
 */

import { calculateCanonicalChecksum } from '../../core/canonicalIdentity';
import {
  MAX_BYTE_VALUE,
  RADIX_3,
  TRITS_PER_BYTE,
  SymbolByte,
  TritByte,
  TritEncodedPayload,
  TritSymbol,
  TritValue,
} from './types';
import {
  assertByte,
  assertDecodedByteRange,
  assertSymbolString,
  assertTrit,
  assertTritStreamLength,
  assertTritSymbol,
  TernaryEncodingError,
} from './validation';

export const TRIT_TO_SYMBOL: readonly TritSymbol[] = Object.freeze(['3', '6', '9']);

export const SYMBOL_TO_TRIT: Readonly<Record<string, TritValue>> = Object.freeze({
  '3': 0,
  '6': 1,
  '9': 2,
});

const POWERS_OF_3: readonly number[] = Object.freeze([1, 3, 9, 27, 81, 243]);

/**
 * Encodes an 8-bit unsigned byte [0..255] into a deterministic 6-trit little-endian tuple.
 */
export function byteToTrits(byte: number): TritByte {
  assertByte(byte);
  let rem = byte;
  const t0 = (rem % RADIX_3) as TritValue; rem = Math.floor(rem / RADIX_3);
  const t1 = (rem % RADIX_3) as TritValue; rem = Math.floor(rem / RADIX_3);
  const t2 = (rem % RADIX_3) as TritValue; rem = Math.floor(rem / RADIX_3);
  const t3 = (rem % RADIX_3) as TritValue; rem = Math.floor(rem / RADIX_3);
  const t4 = (rem % RADIX_3) as TritValue; rem = Math.floor(rem / RADIX_3);
  const t5 = (rem % RADIX_3) as TritValue;

  return Object.freeze([t0, t1, t2, t3, t4, t5]);
}

/**
 * Decodes a 6-trit little-endian tuple into an 8-bit unsigned byte [0..255].
 * Rejects corrupt permutations that evaluate to [256..728].
 */
export function tritsToByte(trits: readonly TritValue[] | readonly number[]): number {
  if (!trits || trits.length !== TRITS_PER_BYTE) {
    throw new TernaryEncodingError(
      `Exactly ${TRITS_PER_BYTE} trits required to decode a single byte. Received: ${trits ? trits.length : 0}`
    );
  }

  let byteVal = 0;
  for (let i = 0; i < TRITS_PER_BYTE; i++) {
    const t = trits[i];
    assertTrit(t, `TritsToByte index ${i}`);
    byteVal += t * POWERS_OF_3[i];
  }

  assertDecodedByteRange(byteVal);
  return byteVal;
}

/**
 * Encodes an 8-bit byte directly into 6 symbolic characters from {'3', '6', '9'}.
 */
export function byteToSymbols(byte: number): SymbolByte {
  const trits = byteToTrits(byte);
  return Object.freeze([
    TRIT_TO_SYMBOL[trits[0]],
    TRIT_TO_SYMBOL[trits[1]],
    TRIT_TO_SYMBOL[trits[2]],
    TRIT_TO_SYMBOL[trits[3]],
    TRIT_TO_SYMBOL[trits[4]],
    TRIT_TO_SYMBOL[trits[5]],
  ]);
}

/**
 * Decodes 6 symbolic characters from {'3', '6', '9'} into an 8-bit byte [0..255].
 */
export function symbolsToByte(symbols: readonly TritSymbol[] | readonly string[]): number {
  if (!symbols || symbols.length !== TRITS_PER_BYTE) {
    throw new TernaryEncodingError(
      `Exactly ${TRITS_PER_BYTE} symbols required to decode a single byte. Received: ${symbols ? symbols.length : 0}`
    );
  }

  const trits: TritValue[] = new Array(TRITS_PER_BYTE);
  for (let i = 0; i < TRITS_PER_BYTE; i++) {
    const s = symbols[i];
    assertTritSymbol(s, `symbolsToByte index ${i}`);
    trits[i] = SYMBOL_TO_TRIT[s];
  }

  return tritsToByte(trits);
}

/**
 * Encodes a buffer or array of bytes into an array of numeric trits.
 */
export function encodeBytesToTrits(bytes: Uint8Array | readonly number[]): readonly TritValue[] {
  if (!bytes) return Object.freeze([]);
  const tritArray: TritValue[] = new Array(bytes.length * TRITS_PER_BYTE);

  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i];
    assertByte(b, `Byte at index ${i}`);
    const trits = byteToTrits(b);
    const baseOffset = i * TRITS_PER_BYTE;
    tritArray[baseOffset] = trits[0];
    tritArray[baseOffset + 1] = trits[1];
    tritArray[baseOffset + 2] = trits[2];
    tritArray[baseOffset + 3] = trits[3];
    tritArray[baseOffset + 4] = trits[4];
    tritArray[baseOffset + 5] = trits[5];
  }

  return Object.freeze(tritArray);
}

/**
 * Decodes an array of numeric trits into a Uint8Array of bytes.
 */
export function decodeTritsToBytes(trits: readonly TritValue[] | readonly number[]): Uint8Array {
  if (!trits || trits.length === 0) return new Uint8Array(0);
  assertTritStreamLength(trits.length);

  const byteCount = trits.length / TRITS_PER_BYTE;
  const out = new Uint8Array(byteCount);

  for (let i = 0; i < byteCount; i++) {
    const offset = i * TRITS_PER_BYTE;
    out[i] = tritsToByte(trits.slice(offset, offset + TRITS_PER_BYTE));
  }

  return out;
}

/**
 * Encodes a buffer or array of bytes into a contiguous string of '3', '6', '9' symbols.
 */
export function encodeBytesToSymbols(bytes: Uint8Array | readonly number[]): string {
  if (!bytes || bytes.length === 0) return '';
  const trits = encodeBytesToTrits(bytes);
  let out = '';
  for (let i = 0; i < trits.length; i++) {
    out += TRIT_TO_SYMBOL[trits[i]];
  }
  return out;
}

/**
 * Decodes a contiguous string of '3', '6', '9' symbols into a Uint8Array of bytes.
 */
export function decodeSymbolsToBytes(symbolStr: string): Uint8Array {
  if (!symbolStr || symbolStr.length === 0) return new Uint8Array(0);
  assertSymbolString(symbolStr);

  const byteCount = symbolStr.length / TRITS_PER_BYTE;
  const out = new Uint8Array(byteCount);

  for (let i = 0; i < byteCount; i++) {
    const offset = i * TRITS_PER_BYTE;
    const chunk = [
      symbolStr[offset],
      symbolStr[offset + 1],
      symbolStr[offset + 2],
      symbolStr[offset + 3],
      symbolStr[offset + 4],
      symbolStr[offset + 5],
    ];
    out[i] = symbolsToByte(chunk);
  }

  return out;
}

/**
 * Encodes any UTF-8 text string into a deterministic 369 symbol string.
 */
export function encodeStringToSymbols(text: string): string {
  if (typeof text !== 'string') {
    throw new TernaryEncodingError(`Input text must be a string. Received: ${typeof text}`);
  }
  if (text.length === 0) return '';
  const bytes = new TextEncoder().encode(text);
  return encodeBytesToSymbols(bytes);
}

/**
 * Decodes a 369 symbol string back into its original UTF-8 text.
 */
export function decodeSymbolsToString(symbolStr: string): string {
  if (!symbolStr || symbolStr.length === 0) return '';
  const bytes = decodeSymbolsToBytes(symbolStr);
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch (err) {
    throw new TernaryEncodingError(`Failed to decode UTF-8 string from bytes: ${(err as Error).message}`);
  }
}

/**
 * High-level composite encoding returning a full frozen TritEncodedPayload with canonical checksum.
 */
export function encodeToTritPayload(bytes: Uint8Array | readonly number[]): TritEncodedPayload {
  const trits = encodeBytesToTrits(bytes);
  const symbolString = encodeBytesToSymbols(bytes);
  const byteLength = bytes.length;
  const tritCount = trits.length;

  const checksum = calculateCanonicalChecksum({
    byteLength,
    tritCount,
    symbolString,
  });

  return Object.freeze({
    byteLength,
    tritCount,
    trits,
    symbolString,
    checksum,
  });
}
