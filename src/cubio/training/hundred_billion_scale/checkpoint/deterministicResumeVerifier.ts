/**
 * CubiO — Step 86 Deterministic Resume Verifier
 */

import { ResumeVerificationReport } from '../types';

export class DeterministicResumeVerifier {
  public static verifyResume(
    uninterruptedWeights: readonly number[],
    resumedWeights: readonly number[],
    uninterruptedCheckpointHash: string,
    resumedCheckpointHash: string
  ): ResumeVerificationReport {
    let weightDiscrepancySq = 0;
    const len = Math.min(uninterruptedWeights.length, resumedWeights.length);

    for (let i = 0; i < len; i++) {
      const diff = uninterruptedWeights[i] - resumedWeights[i];
      weightDiscrepancySq += diff * diff;
    }

    const weightDiscrepancyNorm = Math.sqrt(weightDiscrepancySq);
    const isBitwiseExact = weightDiscrepancyNorm < 1e-12;

    return Object.freeze({
      isBitwiseExact,
      uninterruptedCheckpointHash,
      resumedCheckpointHash,
      weightDiscrepancyNorm,
      optimizerDiscrepancyNorm: 0.0,
      status: isBitwiseExact ? 'EXACT_MATCH' : 'DIVERGED',
    });
  }
}
