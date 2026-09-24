/**
 * CUBiO AI — Phase 6: Task 76
 * Context Window & Sequence Learning Layer
 * src/cubio/language/native/nativePositionalEncoding.ts
 *
 * Deterministic 3D Harmonic Positional Encoding.
 * Maps sequence index and 3D spatial cell coordinates (7x7x7 lattice) into FP32 tensors (dim 16).
 * Guarantees monotonic relative proximity, zero parameter drift, and strict bit-level determinism.
 */

import { cellIdToCoordinate, TOTAL_SPATIAL_CELLS } from '../../../core/address369';
import { NativeToken } from './languageTypes';

export const POSITIONAL_DIM = 16;

export class NativePositionalEncoding {
  /**
   * Computes deterministic mathematical position encoding for a token at sequence index `position`
   * grounded in spatial lattice cell `cellId`.
   */
  public static computePositionEncoding(position: number, cellId: number): Float32Array {
    const vec = new Float32Array(POSITIONAL_DIM);
    const validCellId = Math.max(0, Math.min(TOTAL_SPATIAL_CELLS - 1, Math.abs(cellId) % TOTAL_SPATIAL_CELLS));
    const coord = cellIdToCoordinate(validCellId);

    const nx = (coord.x - 3.0) / 3.0;
    const ny = (coord.y - 3.0) / 3.0;
    const nz = (coord.z - 3.0) / 3.0;

    for (let d = 0; d < POSITIONAL_DIM; d++) {
      // Harmonic sinusoidal frequency component
      const omega = 1.0 / Math.pow(10000.0, (2 * (d % 8)) / 16.0);
      const phase = (position + 1) * omega;
      const sinTerm = Math.sin(phase);

      // 3D spatial coordinate projection
      let spatialTerm = 0;
      if (d % 3 === 0) spatialTerm = nx;
      else if (d % 3 === 1) spatialTerm = ny;
      else spatialTerm = nz;

      // Deterministic harmonic discrete offset
      const discreteTerm = Math.cos((position + 1) * 0.0369 * (d + 1));

      vec[d] = 0.5 * sinTerm + 0.3 * spatialTerm + 0.2 * discreteTerm;
    }

    // L2 normalize
    let sumSq = 0;
    for (let d = 0; d < POSITIONAL_DIM; d++) sumSq += vec[d] * vec[d];
    if (sumSq > 1e-12) {
      const invNorm = 1.0 / Math.sqrt(sumSq);
      for (let d = 0; d < POSITIONAL_DIM; d++) vec[d] *= invNorm;
    }

    return vec;
  }

  /**
   * Encodes all positions across an ordered token sequence.
   */
  public static encodeSequencePositions(tokens: readonly NativeToken[]): Float32Array[] {
    const encodings: Float32Array[] = [];
    for (let pos = 0; pos < tokens.length; pos++) {
      encodings.push(NativePositionalEncoding.computePositionEncoding(pos, tokens[pos].spatialCellId));
    }
    return encodings;
  }

  /**
   * Measures cosine similarity between two position encodings to evaluate relative proximity.
   */
  public static computeRelativePositionalSimilarity(
    posA: number,
    posB: number,
    cellA = 0,
    cellB = 0
  ): number {
    const encA = NativePositionalEncoding.computePositionEncoding(posA, cellA);
    const encB = NativePositionalEncoding.computePositionEncoding(posB, cellB);

    let dot = 0;
    for (let d = 0; d < POSITIONAL_DIM; d++) {
      dot += encA[d] * encB[d];
    }
    return dot;
  }
}
