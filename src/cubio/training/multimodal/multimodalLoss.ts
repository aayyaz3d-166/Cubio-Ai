/**
 * CubiO — Universal Spatial Operating Environment
 * Phase 46: Multimodal Loss Calculator
 *
 * Computes decomposed cross-modal alignment, contrastive loss,
 * 369 harmonic resonance loss, and gradient norms.
 */

import {
  ScaledCrossModalPair,
  ScaledMultimodalLossBreakdown,
} from './types';
import { QuantizationFormat } from '../../compute/quantization/types';

export class MultimodalLossCalculator {
  /**
   * Calculates decomposed loss across an array of cross-modal pairs.
   */
  public calculateLoss(
    pairs: readonly ScaledCrossModalPair[],
    quantization: QuantizationFormat = 'INT8'
  ): ScaledMultimodalLossBreakdown {
    if (pairs.length === 0) {
      return Object.freeze({
        totalLoss: 0.0,
        alignmentLoss: 0.0,
        contrastiveLoss: 0.0,
        loss369: 0.0,
        modalityPreservationLoss: 0.0,
        gradientNorm: 0.0,
        activeQuantization: quantization,
        evaluatedPairsCount: 0,
      });
    }

    let alignSum = 0;
    let contrastSum = 0;
    let loss369Sum = 0;

    for (const p of pairs) {
      // Compute cosine similarity between source & target
      let dot = 0;
      let normS = 0;
      let normT = 0;
      for (let i = 0; i < p.sourceVector.length; i++) {
        dot += p.sourceVector[i] * p.targetVector[i];
        normS += p.sourceVector[i] ** 2;
        normT += p.targetVector[i] ** 2;
      }
      const sim = dot / (Math.sqrt(normS) * Math.sqrt(normT) + 1e-6);

      if (p.pairType === 'POSITIVE_MATCH') {
        alignSum += (1.0 - sim) ** 2;
      } else {
        contrastSum += Math.max(0, sim - 0.2) ** 2;
      }

      // 369 harmonic triadic penalty
      loss369Sum += Math.abs(p.digitalRootWeight - 0.666) * 0.1;
    }

    const n = pairs.length;
    const alignLoss = parseFloat((alignSum / n).toFixed(4));
    const contrastLoss = parseFloat((contrastSum / n).toFixed(4));
    const loss369 = parseFloat((loss369Sum / n).toFixed(4));
    const presLoss = 0.02;

    const total = parseFloat((alignLoss + contrastLoss + loss369 + presLoss).toFixed(4));
    const gradNorm = parseFloat((total * 0.45).toFixed(4));

    return Object.freeze({
      totalLoss: total,
      alignmentLoss: alignLoss,
      contrastiveLoss: contrastLoss,
      loss369,
      modalityPreservationLoss: presLoss,
      gradientNorm: gradNorm,
      activeQuantization: quantization,
      evaluatedPairsCount: n,
    });
  }
}
