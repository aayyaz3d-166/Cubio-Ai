/**
 * CUBiO AI — Task 177: Context Relevance & Ranking
 * src/cubio/model/native_ranking/scoringEngine.ts
 *
 * Deterministic multi-factor scoring engine evaluating candidate chunks/records
 * across semantic relevance, epistemic hierarchy, recency/state, provenance, and
 * 3D spatial HCP cell affinity.
 *
 * STRICT INVARIANTS:
 * 1. Pure deterministic native computation; zero external ML/vector search libraries.
 * 2. Strict epistemic hierarchy: AXIOM (1.00) > FACT (0.90) > DERIVED (0.80) >
 *    THEORY (0.65) > OBSERVATION (0.45) > HYPOTHESIS (0.25).
 * 3. Unsupported promotion guard: Speculative hypotheses cannot be pinned as truth anchors.
 * 4. Microsecond time normalization & hyperbolic decay for stable recency scoring.
 * 5. Deterministic tie-breaking by objectId ascending within epsilon tolerance (1e-5).
 */

import {
  CandidateDescriptor,
  DEFAULT_RANKING_WEIGHTS,
  EPISTEMIC_SCORES,
  EpistemicStatus,
  RankingFactors,
  RankingQuery,
  RankingWeights,
  UnsupportedEpistemicPromotionError,
} from './types.js';

export class ScoringEngine {
  private readonly defaultWeights: RankingWeights;

  constructor(customWeights?: Partial<RankingWeights>) {
    this.defaultWeights = {
      relevanceWeight: customWeights?.relevanceWeight ?? DEFAULT_RANKING_WEIGHTS.relevanceWeight,
      epistemicWeight: customWeights?.epistemicWeight ?? DEFAULT_RANKING_WEIGHTS.epistemicWeight,
      recencyWeight: customWeights?.recencyWeight ?? DEFAULT_RANKING_WEIGHTS.recencyWeight,
      provenanceWeight: customWeights?.provenanceWeight ?? DEFAULT_RANKING_WEIGHTS.provenanceWeight,
      spatialWeight: customWeights?.spatialWeight ?? DEFAULT_RANKING_WEIGHTS.spatialWeight,
    };

    // Normalize weights if necessary so sum is exactly 1.0
    const total =
      this.defaultWeights.relevanceWeight +
      this.defaultWeights.epistemicWeight +
      this.defaultWeights.recencyWeight +
      this.defaultWeights.provenanceWeight +
      this.defaultWeights.spatialWeight;

    if (Math.abs(total - 1.0) > 1e-4) {
      this.defaultWeights = {
        relevanceWeight: this.defaultWeights.relevanceWeight / total,
        epistemicWeight: this.defaultWeights.epistemicWeight / total,
        recencyWeight: this.defaultWeights.recencyWeight / total,
        provenanceWeight: this.defaultWeights.provenanceWeight / total,
        spatialWeight: this.defaultWeights.spatialWeight / total,
      };
    }
  }

  /**
   * Tokenize an arbitrary string into lowercase alphanumeric term tokens.
   */
  public tokenize(text: string): readonly string[] {
    if (!text || text.trim().length === 0) return [];
    return Object.freeze(
      text
        .toLowerCase()
        .replace(/[^a-z0-9_\-\s]/g, ' ')
        .split(/\s+/)
        .filter((t) => t.length > 1)
    );
  }

  /**
   * Compute semantic relevance score [0, 1] using term overlap, frequency, and exact phrase bonus.
   */
  public computeRelevanceScore(queryTerms: readonly string[], candidate: CandidateDescriptor): number {
    if (queryTerms.length === 0) return 0.0;

    const candidateTerms: string[] = [];
    if (candidate.terms && candidate.terms.length > 0) {
      candidateTerms.push(...candidate.terms.map((t) => t.toLowerCase()));
    }
    if (candidate.textPreview) {
      candidateTerms.push(...this.tokenize(candidate.textPreview));
    }
    if (candidate.domain) {
      candidateTerms.push(...this.tokenize(candidate.domain));
    }

    if (candidateTerms.length === 0) return 0.0;

    const candidateTermSet = new Set(candidateTerms);
    let matchedCount = 0;
    for (const qt of queryTerms) {
      if (candidateTermSet.has(qt)) {
        matchedCount++;
      }
    }

    // Overlap fraction
    const overlapFraction = matchedCount / queryTerms.length;

    // Exact query inclusion bonus if textPreview is present
    let phraseBonus = 0.0;
    if (candidate.textPreview && queryTerms.length > 1) {
      const fullQuery = queryTerms.join(' ');
      if (candidate.textPreview.toLowerCase().includes(fullQuery)) {
        phraseBonus = 0.25;
      }
    }

    const rawRelevance = overlapFraction * 0.75 + phraseBonus;
    return Math.min(1.0, Math.max(0.0, Number(rawRelevance.toFixed(6))));
  }

  /**
   * Compute epistemic score [0, 1] adhering strictly to the epistemic hierarchy.
   * Enforces unsupported promotion guard against speculative pinning.
   */
  public computeEpistemicScore(candidate: CandidateDescriptor): number {
    const status = candidate.epistemicStatus;
    const baseScore = EPISTEMIC_SCORES[status];

    if (baseScore === undefined) {
      // Default uncertified status receives lowest score
      return 0.10;
    }

    // Guard: Speculative hypotheses cannot claim pinned anchor truth status
    if (candidate.isPinnedAnchor && (status === 'HYPOTHESIS' || status === 'OBSERVATION')) {
      throw new UnsupportedEpistemicPromotionError(
        candidate.objectId,
        status,
        'Cannot elevate uncertified speculative hypothesis or observation to pinned anchor status.'
      );
    }

    return baseScore;
  }

  /**
   * Compute recency and state score [0, 1] using hyperbolic time decay and OCC version state.
   */
  public computeRecencyScore(candidate: CandidateDescriptor, referenceTime: number): number {
    const ageMs = Math.max(0, referenceTime - candidate.createdAt);
    const ageHours = ageMs / (1000 * 60 * 60);

    // Hyperbolic decay: 1 / (1 + 0.02 * ageHours)
    const decay = 1.0 / (1.0 + 0.02 * ageHours);

    // OCC version stability boost: up to +0.10 for active OCC updates
    let occBoost = 0.0;
    if (candidate.occVersion && candidate.occVersion > 1) {
      occBoost = Math.min(0.10, (candidate.occVersion - 1) * 0.02);
    }

    const rawScore = decay * 0.90 + occBoost;
    return Math.min(1.0, Math.max(0.0, Number(rawScore.toFixed(6))));
  }

  /**
   * Compute provenance score [0, 1] reflecting genesis status, verified checksums, and anchor pinning.
   */
  public computeProvenanceScore(candidate: CandidateDescriptor): number {
    let score = 0.30; // Baseline verified reference score

    if (candidate.checksum && candidate.checksum.length === 64) {
      score += 0.20; // Cryptographic SHA-256 integrity bonus
    }

    if (candidate.isPinnedAnchor) {
      score += 0.30; // Canonical genesis anchor bonus
    }

    if (candidate.spatialCellId === 0) {
      score += 0.20; // Genesis origin cell (0) coordinate bonus
    }

    return Math.min(1.0, Math.max(0.0, Number(score.toFixed(6))));
  }

  /**
   * Compute 3D spatial HCP cell affinity score [0, 1].
   */
  public computeSpatialAffinityScore(queryCellId?: number, candidateCellId?: number): number {
    if (queryCellId === undefined || candidateCellId === undefined) {
      return 0.50; // Neutral affinity when spatial cell is unspecified
    }

    if (queryCellId === candidateCellId) {
      return 1.00; // Exact cell match
    }

    const diff = Math.abs(queryCellId - candidateCellId);
    // Hyperbolic proximity decay across HCP cell distance (0..342)
    const affinity = 1.0 / (1.0 + diff / 15.0);
    return Math.min(1.0, Math.max(0.0, Number(affinity.toFixed(6))));
  }

  /**
   * Evaluate all factors and compute the final composite weighted score.
   */
  public scoreCandidate(
    candidate: CandidateDescriptor,
    query: RankingQuery,
    queryTerms: readonly string[],
    referenceTime: number
  ): RankingFactors {
    const weights: RankingWeights = {
      relevanceWeight: query.weights?.relevanceWeight ?? this.defaultWeights.relevanceWeight,
      epistemicWeight: query.weights?.epistemicWeight ?? this.defaultWeights.epistemicWeight,
      recencyWeight: query.weights?.recencyWeight ?? this.defaultWeights.recencyWeight,
      provenanceWeight: query.weights?.provenanceWeight ?? this.defaultWeights.provenanceWeight,
      spatialWeight: query.weights?.spatialWeight ?? this.defaultWeights.spatialWeight,
    };

    const relevanceScore = this.computeRelevanceScore(queryTerms, candidate);
    const epistemicScore = this.computeEpistemicScore(candidate);
    const recencyScore = this.computeRecencyScore(candidate, referenceTime);
    const provenanceScore = this.computeProvenanceScore(candidate);
    const spatialAffinityScore = this.computeSpatialAffinityScore(query.spatialCellId, candidate.spatialCellId);

    const combined =
      relevanceScore * weights.relevanceWeight +
      epistemicScore * weights.epistemicWeight +
      recencyScore * weights.recencyWeight +
      provenanceScore * weights.provenanceWeight +
      spatialAffinityScore * weights.spatialWeight;

    const combinedScore = Math.min(1.0, Math.max(0.0, Number(combined.toFixed(6))));

    return Object.freeze({
      relevanceScore,
      epistemicScore,
      recencyScore,
      provenanceScore,
      spatialAffinityScore,
      combinedScore,
    });
  }
}
