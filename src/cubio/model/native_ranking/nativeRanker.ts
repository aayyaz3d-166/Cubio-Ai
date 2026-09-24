/**
 * CUBiO AI — Task 177: Context Relevance & Ranking
 * src/cubio/model/native_ranking/nativeRanker.ts
 *
 * Deterministic candidate ranker selecting context candidates according to
 * multi-factor composite scores, token budgets, and epistemic filters.
 *
 * STRICT INVARIANTS:
 * 1. Deterministic sorting and tie-breaking: A = B = C, delta = 0.
 * 2. Strict multi-tenant isolation: Cross-tenant candidates rejected fail-closed.
 * 3. Bounded candidate pool (<= 1,000) and token budget ceilings.
 * 4. Zero foreign libraries; pure native TypeScript and node:crypto.
 * 5. Cryptographic SHA-256 ranking digest over ordered candidate set.
 */

import { createHash } from 'node:crypto';
import { ScoringEngine } from './scoringEngine.js';
import { RankingGovernor } from './rankingGovernor.js';
import {
  CandidateDescriptor,
  DEFAULT_RANKING_TOKEN_BUDGET,
  RankedCandidate,
  RankingFactors,
  RankingQuery,
  RankingResult,
} from './types.js';

export class NativeRanker {
  private readonly scoringEngine: ScoringEngine;
  private readonly governor: RankingGovernor;

  constructor(scoringEngine?: ScoringEngine, governor?: RankingGovernor) {
    this.scoringEngine = scoringEngine ?? new ScoringEngine();
    this.governor = governor ?? new RankingGovernor();
  }

  /**
   * Rank a pool of candidate descriptors against a ranking query.
   */
  public rank(
    candidates: readonly CandidateDescriptor[],
    query: RankingQuery
  ): RankingResult {
    const startTime = performance.now();

    // 1. Validate query and actuation lockout
    this.governor.validateQuery(query);

    // 2. Validate candidate pool bounds
    this.governor.assertPoolBounds(candidates);

    // 3. Tokenize query terms
    const queryTerms = this.scoringEngine.tokenize(query.query);
    const referenceTime = query.referenceTime ?? Date.now();
    const tokenBudget = query.tokenBudget ?? DEFAULT_RANKING_TOKEN_BUDGET;
    const minCombinedScore = query.minCombinedScore ?? 0.0;

    const allowedStatusSet = query.allowedEpistemicStatuses
      ? new Set(query.allowedEpistemicStatuses)
      : null;

    // 4. Score and filter candidates
    interface ScoredCandidate {
      candidate: CandidateDescriptor;
      factors: RankingFactors;
    }

    const scoredPool: ScoredCandidate[] = [];

    for (const candidate of candidates) {
      // Strict multi-tenant isolation guard
      this.governor.assertTenantIntegrity(query.tenantId, candidate);

      // Filter by epistemic status if query restricts it
      if (allowedStatusSet && !allowedStatusSet.has(candidate.epistemicStatus)) {
        continue;
      }

      // Compute multi-factor scores
      const factors = this.scoringEngine.scoreCandidate(
        candidate,
        query,
        queryTerms,
        referenceTime
      );

      // Filter by minimum score threshold
      if (factors.combinedScore < minCombinedScore) {
        continue;
      }

      scoredPool.push({ candidate, factors });
    }

    // 5. Deterministic sorting: combinedScore descending, objectId ascending on tie
    scoredPool.sort((a, b) => {
      const diff = b.factors.combinedScore - a.factors.combinedScore;
      if (Math.abs(diff) > 1e-5) {
        return diff;
      }
      // Deterministic tie-breaking by objectId
      return a.candidate.objectId.localeCompare(b.candidate.objectId);
    });

    // 6. Token budget and Top-K selection
    const rankedCandidates: RankedCandidate[] = [];
    let accumulatedTokens = 0;
    const topK = query.topK ?? scoredPool.length;

    for (let i = 0; i < scoredPool.length && rankedCandidates.length < topK; i++) {
      const item = scoredPool[i];
      const itemTokens = item.candidate.tokenCount > 0 ? item.candidate.tokenCount : 1;

      // Stop if adding this candidate exceeds the token budget (if at least one candidate included)
      if (rankedCandidates.length > 0 && accumulatedTokens + itemTokens > tokenBudget) {
        break;
      }

      accumulatedTokens += itemTokens;
      rankedCandidates.push(
        Object.freeze({
          candidate: item.candidate,
          rankPosition: rankedCandidates.length + 1,
          factors: item.factors,
        })
      );
    }

    const endTime = performance.now();
    const latencyMs = Number((endTime - startTime).toFixed(3));

    // 7. Compute cryptographic SHA-256 ranking digest
    const digestHasher = createHash('sha256');
    digestHasher.update(`TENANT:${query.tenantId}\n`);
    digestHasher.update(`QUERY:${query.query}\n`);
    digestHasher.update(`COUNT:${rankedCandidates.length}\n`);
    for (const r of rankedCandidates) {
      digestHasher.update(
        `${r.rankPosition}:${r.candidate.objectId}:${r.factors.combinedScore.toFixed(6)}\n`
      );
    }
    const rankingDigest = digestHasher.digest('hex');

    return Object.freeze({
      query: query.query,
      tenantId: query.tenantId,
      rankedCandidates: Object.freeze(rankedCandidates),
      totalCandidatesEvaluated: candidates.length,
      totalTokens: accumulatedTokens,
      latencyMs,
      rankingDigest,
    });
  }
}
