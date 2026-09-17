/**
 * CUBiO AI — Task 19: Lossless Encode -> Decode Verification Layer
 * Phase 1 — Mathematical Core
 * src/cubio/math/verification/types.ts
 *
 * Types and contracts for mathematical round-trip verification:
 * - Round-trip metrics (byte length, expansion ratio, checksum parity)
 * - Corruption interception report types
 * - Determinism and repeated-run metrics
 */

export interface RoundTripMetrics {
  readonly originalByteLength: number;
  readonly decodedByteLength: number;
  readonly encodedSymbolLength: number;
  /** Ratio of symbol character count to raw byte count (strictly 6.0 for uncompressed 369 symbols) */
  readonly expansionRatio: number;
  readonly checksumPre: string;
  readonly checksumPost: string;
  readonly isBitIdentical: boolean;
  readonly isChecksumIdentical: boolean;
  readonly isLossless: boolean;
}

export interface CorruptionTestResult {
  readonly testName: string;
  readonly mutatedInput: string;
  readonly rejectedFailClosed: boolean;
  readonly errorCaptured?: string;
}

export interface DeterminismResult {
  readonly iterations: number;
  readonly allOutputsIdentical: boolean;
  readonly canonicalChecksum: string;
  readonly divergenceCount: number;
}
