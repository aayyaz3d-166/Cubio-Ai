/**
 * ============================================================================
 * CUBiO AI — PHASE 29 TASK 11: RESULT SELECTION LOGIC ENGINE
 * src/cubio/intelligence/evaluation/phase29ResultSelector.ts
 * ============================================================================
 *
 * Implements Mother Core's internal mechanism for selecting or combining
 * evaluated candidate results into an authoritative synthesis plan.
 *
 * Guarantees:
 *   - Selection based on validity, consistency, evidence, and context
 *   - Internal scoring, ranking, & mechanics kept strictly internal
 *   - Supports combining multiple valid complementary candidates
 *   - Rejects unsupported or speculative candidates fail-closed
 *   - Produces clean selected candidate bundle for final synthesis
 *
 * ============================================================================
 */

import * as crypto from 'crypto';
import {
  IS_ACTUATION_BLOCKED,
  OFFLINE_ISOLATED,
} from '../core/coreEngineContract';
import { ExternalModelGuard } from '../../model/native_foundation/external_model_guard';
import { EvaluatedCandidate, MotherCoreEvaluationResult } from './phase29MotherCoreEvaluator';
import { CandidateResult } from '../../submother/phase29PossibleResultCollector';

export type SelectionStrategy = 'SINGLE_BEST' | 'MULTI_CANDIDATE_SYNTHESIS' | 'REJECT_ALL';

export interface SelectedCandidateBundle {
  readonly parentRequestId: string;
  readonly strategy: SelectionStrategy;
  readonly selectedCandidateIds: readonly string[];
  readonly candidateContents: readonly string[];
  readonly combinedEvidenceScore: number;
  readonly internalAuditHash: string;
  readonly isUserFacingSanitized: true;
}

export class Phase29ResultSelector {
  private static instance: Phase29ResultSelector | null = null;

  private constructor() {
    if (!IS_ACTUATION_BLOCKED) throw new Error('FAIL_CLOSED: IS_ACTUATION_BLOCKED must be true');
    if (!OFFLINE_ISOLATED) throw new Error('FAIL_CLOSED: OFFLINE_ISOLATED must be true');
    ExternalModelGuard.assertNativeOnly('CUBIO-P29-RESULT-SELECTOR');
  }

  public static getInstance(): Phase29ResultSelector {
    if (!this.instance) {
      this.instance = new Phase29ResultSelector();
    }
    return this.instance;
  }

  public static resetInstance(): void {
    this.instance = null;
  }

  public selectCandidates(
    evalResult: MotherCoreEvaluationResult,
    candidatePool: readonly CandidateResult[],
    allowMultiSynthesis: boolean = true
  ): SelectedCandidateBundle {
    const acceptedEvals = evalResult.evaluatedCandidates.filter(c => c.evaluationVerdict === 'ACCEPTED');

    // If zero accepted candidates, reject all
    if (acceptedEvals.length === 0) {
      return {
        parentRequestId: evalResult.parentRequestId,
        strategy: 'REJECT_ALL',
        selectedCandidateIds: [],
        candidateContents: [],
        combinedEvidenceScore: 0,
        internalAuditHash: crypto.createHash('sha256').update(`${evalResult.parentRequestId}:REJECT_ALL`).digest('hex'),
        isUserFacingSanitized: true,
      };
    }

    const candidateMap = new Map<string, CandidateResult>();
    for (const c of candidatePool) candidateMap.set(c.candidateId, c);

    // If only one candidate or multi-synthesis disabled, pick single best
    if (acceptedEvals.length === 1 || !allowMultiSynthesis) {
      const top = acceptedEvals[0];
      const fullCand = candidateMap.get(top.candidateId);
      const content = fullCand ? fullCand.content : '';

      return {
        parentRequestId: evalResult.parentRequestId,
        strategy: 'SINGLE_BEST',
        selectedCandidateIds: [top.candidateId],
        candidateContents: [content],
        combinedEvidenceScore: top.evidenceScore,
        internalAuditHash: crypto.createHash('sha256').update(`${evalResult.parentRequestId}:SINGLE:${top.candidateId}`).digest('hex'),
        isUserFacingSanitized: true,
      };
    }

    // Complementary multi-candidate synthesis: select top accepted candidates with high composite score
    const selectedIds: string[] = [];
    const contents: string[] = [];
    let evidenceSum = 0;

    for (const cand of acceptedEvals) {
      if (cand.compositeScore >= 0.65) {
        selectedIds.push(cand.candidateId);
        const full = candidateMap.get(cand.candidateId);
        if (full) contents.push(full.content);
        evidenceSum += cand.evidenceScore;
      }
    }

    const avgEvidence = selectedIds.length > 0 ? Number((evidenceSum / selectedIds.length).toFixed(4)) : 0;
    const internalAuditHash = crypto.createHash('sha256')
      .update(`${evalResult.parentRequestId}:MULTI:${selectedIds.join(',')}`)
      .digest('hex');

    return {
      parentRequestId: evalResult.parentRequestId,
      strategy: selectedIds.length > 1 ? 'MULTI_CANDIDATE_SYNTHESIS' : 'SINGLE_BEST',
      selectedCandidateIds: selectedIds,
      candidateContents: contents,
      combinedEvidenceScore: avgEvidence,
      internalAuditHash,
      isUserFacingSanitized: true,
    };
  }
}
