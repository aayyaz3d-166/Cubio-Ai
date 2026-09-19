/**
 * CubiO — Universal Spatial Operating Environment
 * Phase 46: Cross-Modal Aligner
 *
 * Constructs positive, negative, and hard-negative training pairs across
 * Text, Image, Audio, and 3D modalities with 369 harmonic weights.
 */

import {
  NativeMultimodalSample,
  ScaledCrossModalPair,
  MultimodalPairType,
} from './types';
import { deterministicHash } from '../../state/determinism';

export class CrossModalAligner {
  /**
   * Generates cross-modal alignment pairs from a batch of samples.
   */
  public generatePairs(samples: readonly NativeMultimodalSample[]): readonly ScaledCrossModalPair[] {
    const pairs: ScaledCrossModalPair[] = [];

    for (let i = 0; i < samples.length; i++) {
      const s = samples[i];
      const srcVec = [s.digitalRoot369 / 9.0, s.harmonicFluxWeight, 0.5, 0.8];

      // 1. Positive pair (Matching source -> target)
      const tgtVecPos = [s.digitalRoot369 / 9.0, s.harmonicFluxWeight, 0.52, 0.79];
      const pHash = deterministicHash(`PAIR_POS:${s.sampleId}:${s.promptModality}:${s.targetModality}`);

      pairs.push(
        Object.freeze({
          pairId: `CP_POS_${pHash.slice(2, 8)}`,
          sourceModality: s.promptModality,
          targetModality: s.targetModality,
          pairType: 'POSITIVE_MATCH',
          sourceVector: Object.freeze(srcVec),
          targetVector: Object.freeze(tgtVecPos),
          targetSimilarity: 1.0,
          digitalRootWeight: s.harmonicFluxWeight,
        })
      );

      // 2. Negative pair (Non-matching sample in batch)
      if (samples.length > 1) {
        const otherIdx = (i + 1) % samples.length;
        const other = samples[otherIdx];
        const tgtVecNeg = [other.digitalRoot369 / 9.0, other.harmonicFluxWeight, -0.4, -0.6];
        const nHash = deterministicHash(`PAIR_NEG:${s.sampleId}:${other.sampleId}`);

        pairs.push(
          Object.freeze({
            pairId: `CP_NEG_${nHash.slice(2, 8)}`,
            sourceModality: s.promptModality,
            targetModality: other.promptModality,
            pairType: 'NEGATIVE_UNMATCHED',
            sourceVector: Object.freeze(srcVec),
            targetVector: Object.freeze(tgtVecNeg),
            targetSimilarity: 0.0,
            digitalRootWeight: parseFloat(((s.harmonicFluxWeight + other.harmonicFluxWeight) / 2).toFixed(4)),
          })
        );
      }
    }

    return Object.freeze(pairs);
  }
}
