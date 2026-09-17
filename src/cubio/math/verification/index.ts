/**
 * CUBiO AI — Task 19: Lossless Encode -> Decode Verification Layer
 * Phase 1 — Mathematical Core
 * src/cubio/math/verification/index.ts
 *
 * Public API for Lossless Encode -> Decode Verification:
 * - Round-trip metric types
 * - Verification engines for raw bytes, UTF-8 text, JSON, and NativeMathValue
 * - Determinism and corruption validation
 */

export * from './types';
export * from './losslessVerifier';
