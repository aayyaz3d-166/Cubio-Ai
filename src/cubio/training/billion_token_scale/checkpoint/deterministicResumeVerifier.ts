/**
 * CubiO — Universal Spatial Operating Environment
 * Step 84: Deterministic Resume Verifier
 *
 * Verifies exact mathematical replay determinism between uninterrupted and resumed trajectories.
 *
 * Classification: SOFTWARE_VALIDATED
 */

export class DeterministicResumeVerifier {
  public static verifyResume(referenceLosses: readonly number[], resumedLosses: readonly number[]): {
    isExact: boolean;
    resumeVariance: number;
  } {
    if (referenceLosses.length !== resumedLosses.length || referenceLosses.length === 0) {
      return { isExact: false, resumeVariance: 1.0 };
    }

    let varianceSum = 0;
    for (let i = 0; i < referenceLosses.length; i++) {
      const diff = referenceLosses[i] - resumedLosses[i];
      varianceSum += diff * diff;
    }

    const sigmaSq = varianceSum / referenceLosses.length;
    return Object.freeze({
      isExact: sigmaSq < 1e-12,
      resumeVariance: parseFloat(sigmaSq.toFixed(6)),
    });
  }
}
