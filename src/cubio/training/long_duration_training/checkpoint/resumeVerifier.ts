/**
 * CubiO — Universal Spatial Operating Environment
 * Step 80: Resume Verifier
 *
 * Verifies exact numerical resume consistency between uninterrupted and resumed runs.
 *
 * Classification: SOFTWARE_VALIDATED
 */

export class ResumeVerifier {
  /**
   * Evaluates resume variance between reference and resumed traces.
   */
  public static verifyResumeConsistency(referenceLossTrace: readonly number[], resumedLossTrace: readonly number[]): {
    isExact: boolean;
    resumeVarianceSigmaSq: number;
  } {
    if (referenceLossTrace.length !== resumedLossTrace.length || referenceLossTrace.length === 0) {
      return { isExact: false, resumeVarianceSigmaSq: 1.0 };
    }

    let varianceSum = 0;
    for (let i = 0; i < referenceLossTrace.length; i++) {
      const diff = referenceLossTrace[i] - resumedLossTrace[i];
      varianceSum += diff * diff;
    }

    const sigmaSq = varianceSum / referenceLossTrace.length;
    return Object.freeze({
      isExact: sigmaSq < 1e-12,
      resumeVarianceSigmaSq: parseFloat(sigmaSq.toFixed(6)),
    });
  }
}
