/**
 * CUBiO AI — Task 18: Native 369 / Ternary Encoding Layer
 * Phase 1 — Mathematical Core
 * src/cubio/math/ternary/types.ts
 *
 * Master type declarations for sovereign deterministic 369/ternary encoding:
 * - Trit values in base-3 radix: {0, 1, 2}
 * - Trit symbols in 369 mapping: {'3', '6', '9'}
 * - Fixed 6-trit byte tuples (3^6 = 729 >= 256 > 3^5 = 243)
 *
 * ARCHITECTURAL LOCKS:
 * 1. ZERO external model dependencies (No Qwen, LLaMA, GPT, HuggingFace, ONNX).
 * 2. Exact mathematical derivation: 6 trits per 8-bit byte.
 * 3. Pure deterministic bijective symbol mapping: 0 <-> '3', 1 <-> '6', 2 <-> '9'.
 * 4. Strictly isolated native module.
 */

export type TritValue = 0 | 1 | 2;

export type TritSymbol = '3' | '6' | '9';

export type TritByte = readonly [
  TritValue,
  TritValue,
  TritValue,
  TritValue,
  TritValue,
  TritValue
];

export type SymbolByte = readonly [
  TritSymbol,
  TritSymbol,
  TritSymbol,
  TritSymbol,
  TritSymbol,
  TritSymbol
];

export interface TritEncodedPayload {
  /** Total number of bytes encoded */
  readonly byteLength: number;
  /** Total number of trits (byteLength * 6) */
  readonly tritCount: number;
  /** Array of numeric trits {0, 1, 2} */
  readonly trits: readonly TritValue[];
  /** String of 369 symbols ('3', '6', '9') */
  readonly symbolString: string;
  /** Deterministic SHA-256 canonical checksum */
  readonly checksum: string;
}

export const TRITS_PER_BYTE = 6;
export const RADIX_3 = 3;
export const RADIX_3_POWER_5 = 243; // 3^5 = 243 < 256 (insufficient)
export const RADIX_3_POWER_6 = 729; // 3^6 = 729 >= 256 (minimal sufficient)
export const MAX_BYTE_VALUE = 255;
