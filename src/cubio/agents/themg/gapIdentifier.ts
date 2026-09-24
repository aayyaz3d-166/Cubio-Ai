/**
 * CUBiO AI — 3D Memory Studio
 * AGENT-005 — TheMG (Evidence & Solution Planning Agent)
 * src/cubio/agents/themg/gapIdentifier.ts
 *
 * Identifies architectural gaps, missing capabilities, unresolved questions,
 * and dependency bottlenecks from synthesized facts and observed failures.
 */

import {
  TheMGFact,
  TheMGObservedFailure,
  TheMGUnresolvedQuestion,
  TheMGPlanningScope,
} from './types';

export class TheMGGapIdentifier {
  /**
   * Identifies gaps and generates structured unresolved questions.
   */
  public identifyGaps(
    scope: TheMGPlanningScope,
    facts: readonly TheMGFact[],
    failures: readonly TheMGObservedFailure[]
  ): {
    readonly unresolvedQuestions: readonly TheMGUnresolvedQuestion[];
    readonly identifiedGaps: readonly string[];
  } {
    const questions: TheMGUnresolvedQuestion[] = [];
    const gaps: string[] = [];

    // Analyze failures
    for (const failure of failures) {
      gaps.push(`Defect: ${failure.symptom}`);
      questions.push({
        questionId: `Q_${failure.failureId}`,
        question: `What is the minimal non-breaking intervention to resolve: "${failure.symptom}"?`,
        impact: `Resolves ${failure.severity} failure in ${failure.testOrGateReference}`,
        recommendedInvestigationStep: `Inspect stack traces and assertions in ${failure.testOrGateReference}`,
      });
    }

    // Check for missing capabilities or empty evidence
    if (facts.length === 0 && failures.length === 0) {
      gaps.push('Insufficient evidence: no verified facts or prior test records supplied.');
      questions.push({
        questionId: 'Q_BASELINE_EVIDENCE',
        question: 'What baseline tests or benchmarks exist for this objective?',
        impact: 'Prevents ungrounded development',
        recommendedInvestigationStep: 'Run MEA memory retrieval or TGA gate discovery.',
      });
    }

    return {
      unresolvedQuestions: Object.freeze(questions),
      identifiedGaps: Object.freeze(gaps),
    };
  }
}
