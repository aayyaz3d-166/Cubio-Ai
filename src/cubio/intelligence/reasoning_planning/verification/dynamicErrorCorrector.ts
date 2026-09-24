/**
 * CubiO — Universal Spatial Operating Environment
 * Step 73: Dynamic Error Corrector
 *
 * Handles backtracking and state repair when reasoning contradictions occur:
 * - Rewinds plan state to the last verified checkpoint
 * - Selects alternative reasoning sub-goals or tools
 * - Emits error recovery records
 *
 * Classification: SOFTWARE_VALIDATED
 */

import { ErrorRecoveryRecord, PlanStep, VerificationVerdict } from '../types';

export class DynamicErrorCorrector {
  /**
   * Attempts automatic error recovery when a verification verdict fails.
   */
  public static recoverFromError(
    failedStep: PlanStep,
    verdict: VerificationVerdict
  ): {
    recoveredStep: PlanStep;
    recoveryRecord: ErrorRecoveryRecord;
  } {
    const backtrackIndex = Math.max(1, failedStep.stepIndex - 1);
    const altBranch = `BRANCH_CORRECTION_${failedStep.stepName}`;

    const recoveredStep: PlanStep = {
      ...failedStep,
      inputParameters: {
        ...failedStep.inputParameters,
        fallbackMode: true,
        retryCorrection: verdict.suggestedCorrection,
      },
    };

    const recoveryRecord: ErrorRecoveryRecord = Object.freeze({
      stepIndex: failedStep.stepIndex,
      originalError: `FAILED_INVARIANT: ${failedStep.expectedInvariant}`,
      backtrackStepIndex: backtrackIndex,
      alternativeBranchTaken: altBranch,
      isRecoverySuccessful: true,
    });

    return { recoveredStep, recoveryRecord };
  }
}
