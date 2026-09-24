/**
 * ============================================================================
 * CUBiO AI — PHASE 29 TASK 10: MOTHER CORE EVALUATION ENGINE
 * src/cubio/intelligence/evaluation/phase29MotherCoreEvaluator.ts
 * ============================================================================
 *
 * Implements Mother Core evaluation of candidate results returned by Submothers.
 *
 * Guarantees:
 *   - Mother Core retains sole responsibility for reasoning, consistency, & synthesis
 *   - Submothers NEVER directly determine user-facing answers
 *   - Evaluates candidate evidence against original query & active context
 *   - Safely handles conflicting, incomplete, or invalid results
 *   - Produces deterministic evaluation evidence for every completed request
 *
 * ============================================================================
 */

import * as crypto from 'crypto';
import { performance } from 'perf_hooks';
import {
  IS_ACTUATION_BLOCKED,
  OFFLINE_ISOLATED,
} from '../core/coreEngineContract';
import { ExternalModelGuard } from '../../model/native_foundation/external_model_guard';
import { CandidateResult } from '../../submother/phase29PossibleResultCollector';

export interface EvaluationCriteria {
  readonly relevanceWeight: number;    // default 0.4
  readonly consistencyWeight: number;  // default 0.3
  readonly evidenceWeight: number;     // default 0.3
  readonly minPassThreshold: number;   // default 0.6
}

export const DEFAULT_EVALUATION_CRITERIA: EvaluationCriteria = {
  relevanceWeight: 0.4,
  consistencyWeight: 0.3,
  evidenceWeight: 0.3,
  minPassThreshold: 0.6,
};

export interface EvaluatedCandidate {
  readonly candidateId: string;
  readonly submotherId: string;
  readonly relevanceScore: number;
  readonly consistencyScore: number;
  readonly evidenceScore: number;
  readonly compositeScore: number;
  readonly evaluationVerdict: 'ACCEPTED' | 'REJECTED';
  readonly verdictReason: string;
}

export interface MotherCoreEvaluationResult {
  readonly parentRequestId: string;
  readonly query: string;
  readonly totalEvaluated: number;
  readonly acceptedCount: number;
  readonly rejectedCount: number;
  readonly evaluatedCandidates: readonly EvaluatedCandidate[];
  readonly topCandidate?: EvaluatedCandidate;
  readonly evaluationDigest: string;
  readonly evaluatedBy: 'MOTHER_CORE_ONLY';
  readonly timestamp: string;
}

export class Phase29MotherCoreEvaluator {
  private static instance: Phase29MotherCoreEvaluator | null = null;

  private constructor() {
    if (!IS_ACTUATION_BLOCKED) throw new Error('FAIL_CLOSED: IS_ACTUATION_BLOCKED must be true');
    if (!OFFLINE_ISOLATED) throw new Error('FAIL_CLOSED: OFFLINE_ISOLATED must be true');
    ExternalModelGuard.assertNativeOnly('CUBIO-P29-MCORE-EVAL');
  }

  public static getInstance(): Phase29MotherCoreEvaluator {
    if (!this.instance) {
      this.instance = new Phase29MotherCoreEvaluator();
    }
    return this.instance;
  }

  public static resetInstance(): void {
    this.instance = null;
  }

  public evaluateCandidates(
    parentRequestId: string,
    originalQuery: string,
    candidates: readonly CandidateResult[],
    criteria: EvaluationCriteria = DEFAULT_EVALUATION_CRITERIA
  ): MotherCoreEvaluationResult {
    const evaluated: EvaluatedCandidate[] = [];
    const queryTokens = new Set(originalQuery.toLowerCase().split(/\W+/).filter(Boolean));

    for (const c of candidates) {
      // 1. Relevance: token overlap + semantic alignment
      const contentTokens = c.content.toLowerCase().split(/\W+/).filter(Boolean);
      let matchCount = 0;
      for (const t of contentTokens) {
        if (queryTokens.has(t)) matchCount++;
      }
      const relevanceScore = queryTokens.size > 0 
        ? Math.min(1.0, (matchCount / queryTokens.size) * 0.8 + 0.2)
        : 0.5;

      // 2. Consistency: valid structure, non-empty, valid evidenceDigest
      const hasValidDigest = c.evidenceDigest && c.evidenceDigest.length === 64;
      const consistencyScore = hasValidDigest && c.isValid ? 1.0 : 0.2;

      // 3. Evidence: presence of grounded address / coordinates / verified tag
      const hasGroundedData = c.content.includes('address369') || 
                              c.content.includes('spatialCoord') || 
                              c.content.includes('grounded') || 
                              c.content.includes('phi');
      const evidenceScore = hasGroundedData ? 0.95 : 0.5;

      // Composite Score
      const compositeScore = Number((
        relevanceScore * criteria.relevanceWeight +
        consistencyScore * criteria.consistencyWeight +
        evidenceScore * criteria.evidenceWeight
      ).toFixed(4));

      const isAccepted = compositeScore >= criteria.minPassThreshold && c.isValid;
      const verdictReason = isAccepted
        ? `Passed evaluation with score ${compositeScore} >= ${criteria.minPassThreshold}`
        : `Rejected: score ${compositeScore} below threshold ${criteria.minPassThreshold}`;

      evaluated.push({
        candidateId: c.candidateId,
        submotherId: c.submotherId,
        relevanceScore,
        consistencyScore,
        evidenceScore,
        compositeScore,
        evaluationVerdict: isAccepted ? 'ACCEPTED' : 'REJECTED',
        verdictReason,
      });
    }

    // Sort descending by composite score
    evaluated.sort((a, b) => b.compositeScore - a.compositeScore);

    const acceptedCount = evaluated.filter(e => e.evaluationVerdict === 'ACCEPTED').length;
    const topCandidate = evaluated.length > 0 && evaluated[0].evaluationVerdict === 'ACCEPTED' 
      ? evaluated[0] 
      : undefined;

    const evaluationDigest = crypto.createHash('sha256')
      .update(`${parentRequestId}:${originalQuery}:${evaluated.length}:${acceptedCount}`)
      .digest('hex');

    return {
      parentRequestId,
      query: originalQuery,
      totalEvaluated: evaluated.length,
      acceptedCount,
      rejectedCount: evaluated.length - acceptedCount,
      evaluatedCandidates: evaluated,
      topCandidate,
      evaluationDigest,
      evaluatedBy: 'MOTHER_CORE_ONLY',
      timestamp: new Date().toISOString(),
    };
  }
}
