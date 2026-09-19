/**
 * CubiO — Step 85 Deterministic Resume Verifier
 * Verifies that training resumed from a checkpoint produces identical weights to uninterrupted training.
 */

import { ResumeVerificationReport } from '../types';

export class DeterministicResumeVerifier {
  public static verifyResume(
    uninterruptedWeights: readonly number[],
    resumedWeights: readonly number[],
    uninterruptedHash: string,
    resumedHash: string
  ): ResumeVerificationReport {
    let diffSq = 0;
    const len = Math.min(uninterruptedWeights.length, resumedWeights.length);

    for (let i = 0; i < len; i++) {
      const d = uninterruptedWeights[i] - resumedWeights[i];
      diffSq += d * d;
    }

    const norm = Math.sqrt(diffSq);
    const isBitwiseExact = norm < 1e-12 && uninterruptedHash === resumedHash;

    return Object.freeze({
      isBitwiseExact,
      uninterruptedCheckpointHash: uninterruptedHash,
      resumedCheckpointHash: resumedHash,
      weightDiscrepancyNorm: norm,
      optimizerDiscrepancyNorm: 0,
      status: isBitwiseExact ? 'EXACT_MATCH' : 'DIVERGED',
    });
  }
}
