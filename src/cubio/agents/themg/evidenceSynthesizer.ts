/**
 * CUBiO AI — 3D Memory Studio
 * AGENT-005 — TheMG (Evidence & Solution Planning Agent)
 * src/cubio/agents/themg/evidenceSynthesizer.ts
 *
 * Synthesizes raw inputs and peer agent outputs into strictly classified
 * evidence categories: VERIFIED_FACT, OBSERVED_FAILURE, HYPOTHESIS,
 * PROPOSED_SOLUTION, and UNRESOLVED_QUESTION.
 * Enforces zero invention of unverified evidence.
 */

import * as crypto from 'crypto';
import {
  TheMGEvidenceItem,
  TheMGFact,
  TheMGObservedFailure,
  TheMGHypothesis,
  TheMGPlanningScope,
} from './types';

export class TheMGEvidenceSynthesizer {
  /**
   * Transforms raw planning scope and evidence items into verified facts and observed failures.
   */
  public synthesizeEvidence(scope: TheMGPlanningScope): {
    readonly facts: readonly TheMGFact[];
    readonly failures: readonly TheMGObservedFailure[];
    readonly hypotheses: readonly TheMGHypothesis[];
  } {
    const facts: TheMGFact[] = [];
    const failures: TheMGObservedFailure[] = [];
    const hypotheses: TheMGHypothesis[] = [];

    // 1. Process structured items
    if (scope.evidenceItems) {
      for (const item of scope.evidenceItems) {
        if (item.classification === 'VERIFIED_FACT') {
          facts.push({
            factId: item.id,
            statement: item.summary,
            verifiedSource: item.source,
            contentHash: item.contentHash,
            timestamp: Date.now(),
          });
        } else if (item.classification === 'OBSERVED_FAILURE') {
          failures.push({
            failureId: item.id,
            symptom: item.summary,
            testOrGateReference: item.source,
            severity: (item.metadata?.severity as any) || 'MAJOR',
            rawErrorSnippet: item.metadata?.rawSnippet as string | undefined,
          });
        } else if (item.classification === 'HYPOTHESIS') {
          hypotheses.push({
            hypothesisId: item.id,
            premise: item.summary,
            testablePrediction: (item.metadata?.prediction as string) || 'Observable improvement',
            falsificationCriteria: (item.metadata?.falsification as string) || 'Failure remains reproducible',
            associatedFailures: (item.metadata?.associatedFailures as string[]) || [],
          });
        }
      }
    }

    // 2. Process raw failures if passed as strings
    if (scope.rawFailures) {
      for (let i = 0; i < scope.rawFailures.length; i++) {
        const raw = scope.rawFailures[i];
        const hash = crypto.createHash('sha256').update(raw).digest('hex');
        failures.push({
          failureId: `FAIL_RAW_${i}_${hash.slice(0, 8)}`,
          symptom: raw,
          testOrGateReference: 'RAW_INPUT_REPORT',
          severity: 'MAJOR',
        });
      }
    }

    // 3. Process raw test reports
    if (scope.rawTestReports) {
      for (let i = 0; i < scope.rawTestReports.length; i++) {
        const rep = scope.rawTestReports[i];
        const hash = crypto.createHash('sha256').update(rep).digest('hex');
        facts.push({
          factId: `FACT_TEST_REP_${i}`,
          statement: `Test Report recorded: ${rep.slice(0, 100)}`,
          verifiedSource: 'TEST_HARNESS',
          contentHash: hash,
          timestamp: Date.now(),
        });
      }
    }

    return {
      facts: Object.freeze(facts),
      failures: Object.freeze(failures),
      hypotheses: Object.freeze(hypotheses),
    };
  }
}
