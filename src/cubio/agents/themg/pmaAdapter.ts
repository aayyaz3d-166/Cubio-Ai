/**
 * CUBiO AI — 3D Memory Studio
 * AGENT-005 — TheMG (Evidence & Solution Planning Agent)
 * src/cubio/agents/themg/pmaAdapter.ts
 *
 * Sovereign PMA compatibility adapter for TheMG.
 * Bridges PMA Handoff Contracts, Review Verdicts, and Project Memory records
 * into TheMG planning scopes and generates Task Completion Reports upon task finish.
 */

import {
  PMAHandoffContract,
  PMAReviewVerdict,
  PMAGitChanges,
} from '../../language/native/pma/types';
import { PMARxEvidenceSummary } from '../../language/native/pma/pmaRxEvidenceLifecycle';
import {
  TheMGPlanningScope,
  TheMGEvidenceItem,
  TheMGTaskCompletionReport,
} from './types';
import { TheMGTaskReporter } from './taskReporter';

export class TheMGPmaAdapter {
  private readonly reporter: TheMGTaskReporter;

  constructor(customRootDir?: string) {
    this.reporter = new TheMGTaskReporter(customRootDir);
  }

  /**
   * Translates a PMA handoff contract into a TheMGPlanningScope.
   */
  public handoffToPlanningScope(handoff: PMAHandoffContract): TheMGPlanningScope {
    const evidenceItems: TheMGEvidenceItem[] = [];

    // Add objective as verified fact
    evidenceItems.push({
      id: `EV_HANDOFF_${handoff.taskId}`,
      classification: 'VERIFIED_FACT',
      source: `PMAHandoffContract:${handoff.taskId}`,
      summary: `Approved objective: ${handoff.objective}`,
      confidence: 1.0,
      contentHash: handoff.handoffHash,
      metadata: {
        strategy: handoff.reuseStrategy,
        primarySubsystem: handoff.scope.primarySubsystem,
      },
    });

    return Object.freeze({
      taskId: handoff.taskId,
      objective: handoff.objective,
      evidenceItems: Object.freeze(evidenceItems),
      allowedFiles: handoff.allowedFiles,
      protectedFiles: handoff.protectedFiles,
      rawFailures: [],
    });
  }

  /**
   * Called whenever a task completes in CUBiO.
   * Extracts evidence, review verdict, git changes, and RX summary to generate
   * the mandatory Task Completion Report.
   */
  public generateCompletionReport(params: {
    handoff: PMAHandoffContract;
    changes: PMAGitChanges;
    review: PMAReviewVerdict;
    rxSummary?: PMARxEvidenceSummary;
  }): TheMGTaskCompletionReport {
    const { handoff, changes, review, rxSummary } = params;

    const workPerformed: string[] = [
      `Executed task under strategy ${handoff.reuseStrategy}`,
      `Verified implementation against request criteria: ${review.didImplementationMatchRequest ? 'YES' : 'NO'}`,
      `Verified tests and gates pass: ${review.didTestsPass ? 'YES' : 'NO'}`,
    ];

    const testsAndGatesExecuted = [
      { name: 'Unit & Subsystem Tests', status: review.didTestsPass ? ('PASS' as const) : ('FAIL' as const) },
      { name: 'Phase 8 Regression Lock', status: review.didRegressionPass ? ('PASS' as const) : ('FAIL' as const) },
      { name: 'Baseline Invariant Immutability', status: !review.didAnyInvariantDrift ? ('PASS' as const) : ('FAIL' as const) },
    ];

    const importantChanges = [
      ...changes.changedFiles.map((f) => ({
        path: f,
        changeType: 'MODIFIED' as const,
        summary: 'Targeted implementation modification',
      })),
      ...changes.newFiles.map((f) => ({
        path: f,
        changeType: 'CREATED' as const,
        summary: 'New capability or test asset',
      })),
      ...changes.deletedFiles.map((f) => ({
        path: f,
        changeType: 'DELETED' as const,
        summary: 'Removed deprecated file',
      })),
    ];

    const failuresAndGaps: string[] = [];
    if (!review.didTestsPass) failuresAndGaps.push('Test assertion failures encountered during execution.');
    if (review.didAnyInvariantDrift) failuresAndGaps.push('System invariant drift detected against frozen baseline.');
    if (review.wereProtectedFilesTouched) failuresAndGaps.push('Protected baseline files were modified without authorization.');

    const rxEvidenceReference = {
      lifecycleId: rxSummary?.rxLifecycleId || `RX-SYNTH-${handoff.taskId}`,
      masterProvenanceHash: rxSummary?.masterProvenanceHash || handoff.handoffHash,
    };

    const nextAction =
      review.finalVerdict === 'PASS'
        ? 'Proceed with canonical promotion or subsequent pipeline stage.'
        : 'Trigger rollback and inspect failure findings before re-attempting.';

    return this.reporter.generateTaskCompletionReport({
      taskId: handoff.taskId,
      objective: handoff.objective,
      workPerformed,
      resultStatus: review.finalVerdict,
      testsAndGatesExecuted,
      importantChanges,
      failuresAndGaps,
      rxEvidenceReference,
      nextAction,
    });
  }
}
