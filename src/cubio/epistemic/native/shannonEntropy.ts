/**
 * CUBiO AI — Funnel 42: Native Epistemic Reasoning Layer
 * Phase 3 — Information Intelligence
 * src/cubio/epistemic/native/shannonEntropy.ts
 *
 * Strict mathematical Shannon Entropy engine and heuristic metric separation.
 *
 * HARD MATHEMATICAL INVARIANTS:
 * 1. Shannon entropy H(P) = -sum(p_i * log2(p_i)) is defined ONLY on valid probability distributions:
 *    - All p_i >= 0
 *    - sum(p_i) == 1.0 (+- 1e-6)
 *    - Non-empty distribution (n >= 1)
 * 2. Any heuristic uncertainty, score spread, dispersion, or confidence margin
 *    is strictly prohibited from being labeled or aliased as "Shannon entropy".
 */

import { ProbabilityDistributionValidation } from './epistemicTypes';

/** Custom error thrown when an invalid probability distribution is passed to Shannon entropy */
export class EpistemicMathError extends Error {
  constructor(message: string) {
    super(`[EPISTEMIC_MATH_ERROR] ${message}`);
    this.name = 'EpistemicMathError';
  }
}

export class ShannonEntropyEngine {
  public static readonly EPSILON = 1e-6;

  /**
   * Validates whether an array represents a mathematically valid probability distribution.
   * Checks non-emptiness, finiteness, non-negativity, and unit sum: sum(p_i) == 1.0.
   */
  public static validateProbabilityDistribution(
    distribution: readonly number[]
  ): ProbabilityDistributionValidation {
    if (!distribution || distribution.length === 0) {
      return {
        isValid: false,
        sum: 0,
        elementCount: 0,
        error: 'Probability distribution cannot be null or empty',
      };
    }

    let sum = 0;
    for (let i = 0; i < distribution.length; i++) {
      const p = distribution[i];

      if (typeof p !== 'number' || !Number.isFinite(p)) {
        return {
          isValid: false,
          sum,
          elementCount: distribution.length,
          error: `Element at index ${i} is not a finite number: ${p}`,
        };
      }

      if (p < 0) {
        return {
          isValid: false,
          sum,
          elementCount: distribution.length,
          error: `Probability at index ${i} is negative: ${p} < 0`,
        };
      }

      sum += p;
    }

    const roundedSum = Math.round(sum * 1e6) / 1e6;
    const diff = Math.abs(sum - 1.0);
    if (diff > this.EPSILON) {
      return {
        isValid: false,
        sum: roundedSum,
        elementCount: distribution.length,
        error: `Distribution probabilities must sum to 1.0; actual sum = ${roundedSum} (diff = ${diff})`,
      };
    }

    return {
      isValid: true,
      sum: 1.0,
      elementCount: distribution.length,
    };
  }

  /**
   * Computes base-2 Shannon Entropy H(P) = -sum(p_i * log2(p_i)).
   * STRICT GUARANTEE: Validates distribution first. Throws EpistemicMathError if invalid.
   * Convention: 0 * log2(0) = 0.
   */
  public static computeShannonEntropy(distribution: readonly number[]): number {
    const validation = this.validateProbabilityDistribution(distribution);
    if (!validation.isValid) {
      throw new EpistemicMathError(
        `Cannot compute Shannon entropy on invalid distribution: ${validation.error}`
      );
    }

    let entropy = 0;
    for (let i = 0; i < distribution.length; i++) {
      const p = distribution[i];
      if (p > 0) {
        entropy -= p * Math.log2(p);
      }
    }

    // Round to 6 decimal places to prevent IEEE 754 float drift
    return Math.round(Math.max(0, entropy) * 1e6) / 1e6;
  }

  /**
   * Computes Normalized Shannon Entropy H_norm(P) = H(P) / log2(n), strictly in [0.0, 1.0].
   * For n = 1, returns 0.0.
   */
  public static computeNormalizedShannonEntropy(distribution: readonly number[]): number {
    const n = distribution.length;
    if (n <= 1) {
      this.validateProbabilityDistribution(distribution); // Still ensure valid element
      return 0.0;
    }

    const rawEntropy = this.computeShannonEntropy(distribution);
    const maxEntropy = Math.log2(n);
    const normalized = rawEntropy / maxEntropy;

    return Math.round(Math.min(1.0, Math.max(0.0, normalized)) * 1e6) / 1e6;
  }

  /**
   * Evaluates heuristic uncertainty from evidentiary support, contradiction, and confidence gap.
   * EXPLICITLY LABELED AS HEURISTIC: Not Shannon entropy!
   */
  public static calculateHeuristicUncertainty(
    confidence: number,
    supportingWeight: number,
    contradictingWeight: number
  ): number {
    const totalEvidence = supportingWeight + contradictingWeight;
    if (totalEvidence <= 0) {
      return 1.0; // Maximum epistemic uncertainty when zero evidence exists
    }

    // Heuristic margin: balance between support and contradiction
    const balanceFactor = 1.0 - Math.abs(supportingWeight - contradictingWeight) / totalEvidence;
    // Confidence deficit
    const confidenceDeficit = 1.0 - confidence;

    // Blended heuristic uncertainty in [0.0, 1.0]
    const rawHeuristic = 0.5 * balanceFactor + 0.5 * confidenceDeficit;
    return Math.round(Math.min(1.0, Math.max(0.0, rawHeuristic)) * 10000) / 10000;
  }

  /**
   * Evaluates dispersion/spread across a set of weights.
   * EXPLICITLY LABELED AS EVIDENCE DISPERSION: Not Shannon entropy!
   */
  public static calculateEvidenceDispersion(weights: readonly number[]): number {
    if (!weights || weights.length <= 1) {
      return 0.0;
    }

    const n = weights.length;
    const mean = weights.reduce((acc, w) => acc + w, 0) / n;
    const variance = weights.reduce((acc, w) => acc + Math.pow(w - mean, 2), 0) / n;

    return Math.round(Math.sqrt(variance) * 10000) / 10000;
  }

  /**
   * Audits metric labeling to enforce that heuristic scores are never described as Shannon entropy.
   */
  public static assertNotMislabelledAsEntropy(label: string, isFormalDistribution: boolean): void {
    const lower = label.toLowerCase();
    if ((lower.includes('entropy') || lower.includes('shannon')) && !isFormalDistribution) {
      throw new EpistemicMathError(
        `Labeling violation: "${label}" describes a heuristic score, but was labeled as entropy. Heuristic scores must NOT be labeled as Shannon entropy.`
      );
    }
  }
}
