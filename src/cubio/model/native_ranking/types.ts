/**
 * CUBiO AI — Task 177: Context Relevance & Ranking
 * src/cubio/model/native_ranking/types.ts
 *
 * Universal contracts, score factor structures, query specifications,
 * and domain errors for native deterministic context relevance and ranking.
 *
 * STRICT INVARIANTS:
 * 1. Zero foreign libraries (no LangChain, LlamaIndex, ChromaDB, Pinecone, FAISS, PyTorch).
 * 2. Multi-factor deterministic ranking: Relevance (0.40), Epistemic (0.30),
 *    Recency/State (0.15), Provenance/Anchor (0.10), 3D Spatial HCP (0.05).
 * 3. Zero-copy reference ranking: Only lightweight candidate descriptors and metadata
 *    are scored and ranked; full record payloads stay in Primary VDB.
 * 4. Bounded candidate pool (<= 1,000 candidates) and token budget ceilings.
 * 5. Strict multi-tenant isolation: Cross-tenant candidate contamination rejected fail-closed.
 * 6. Epistemic Hierarchy: AXIOM (1.00) > FACT (0.90) > DERIVED (0.80) > THEORY (0.65) >
 *    OBSERVATION (0.45) > HYPOTHESIS (0.25). Unsupported speculative promotion strictly guarded.
 * 7. Triplicate Bitwise Determinism: A = B = C, delta = 0.
 * 8. Permanent hardware actuation lockout: IS_ACTUATION_BLOCKED === true.
 */

export const TASK_177_ID = 'CUBIO-TASK-177-CONTEXT-RELEVANCE-RANKING';
export const IS_ACTUATION_BLOCKED = true;

/** Epistemic status types in strict descending epistemic hierarchy */
export type EpistemicStatus =
  | 'AXIOM'
  | 'FACT'
  | 'DERIVED'
  | 'THEORY'
  | 'OBSERVATION'
  | 'HYPOTHESIS';

/** Canonical epistemic weights in strict hierarchical order */
export const EPISTEMIC_SCORES: Readonly<Record<EpistemicStatus, number>> = Object.freeze({
  AXIOM: 1.00,
  FACT: 0.90,
  DERIVED: 0.80,
  THEORY: 0.65,
  OBSERVATION: 0.45,
  HYPOTHESIS: 0.25,
});

/**
 * Breakdown of individual scoring factors for a candidate.
 */
export interface RankingFactors {
  readonly relevanceScore: number;       // [0, 1] Semantic similarity / term overlap
  readonly provenanceScore: number;      // [0, 1] Lineage depth, genesis anchor, verified source
  readonly recencyScore: number;         // [0, 1] Hyperbolic time decay + OCC state version
  readonly epistemicScore: number;       // [0, 1] Epistemic strength hierarchy
  readonly spatialAffinityScore: number; // [0, 1] 3D HCP lattice proximity / cell affinity
  readonly combinedScore: number;        // [0, 1] Weighted composite score
}

/**
 * Lightweight candidate descriptor for zero-copy memory ranking.
 * Retains only index metadata, references, token count, and terms.
 */
export interface CandidateDescriptor {
  readonly objectId: string;
  readonly chunkId?: string;
  readonly tenantId: string;
  readonly tokenCount: number;
  readonly epistemicStatus: EpistemicStatus;
  readonly spatialCellId?: number;         // 0..342 3D HCP lattice coordinate
  readonly createdAt: number;              // Timestamp in ms
  readonly occVersion?: number;            // VDB OCC version number
  readonly checksum?: string;              // SHA-256 canonical checksum
  readonly isPinnedAnchor?: boolean;       // Genesis anchor or pinned truth
  readonly domain?: string;                // Domain classification
  readonly textPreview?: string;           // Short preview snippet (<= 256 chars)
  readonly terms?: readonly string[];      // Pre-indexed terms or tokens for semantic overlap
}

/**
 * A candidate that has been evaluated, scored, and ranked.
 */
export interface RankedCandidate {
  readonly candidate: CandidateDescriptor;
  readonly rankPosition: number;           // 1-based rank position
  readonly factors: RankingFactors;
}

/**
 * Normalized weights for composite score computation.
 * Total sum MUST equal 1.00.
 */
export interface RankingWeights {
  readonly relevanceWeight: number;        // Default: 0.40
  readonly epistemicWeight: number;        // Default: 0.30
  readonly recencyWeight: number;          // Default: 0.15
  readonly provenanceWeight: number;       // Default: 0.10
  readonly spatialWeight: number;          // Default: 0.05
}

export const DEFAULT_RANKING_WEIGHTS: RankingWeights = Object.freeze({
  relevanceWeight: 0.40,
  epistemicWeight: 0.30,
  recencyWeight: 0.15,
  provenanceWeight: 0.10,
  spatialWeight: 0.05,
});

/** Maximum allowable candidates in a single ranking evaluation pool */
export const MAX_CANDIDATE_POOL_SIZE = 1000;

/** Default token budget ceiling for ranked selection */
export const DEFAULT_RANKING_TOKEN_BUDGET = 4096;

/**
 * Query specification for context relevance ranking.
 */
export interface RankingQuery {
  readonly query: string;
  readonly tenantId: string;
  readonly spatialCellId?: number;
  readonly tokenBudget?: number;           // Max accumulated tokens for top-K selection
  readonly topK?: number;                  // Max number of candidates to return
  readonly weights?: Partial<RankingWeights>;
  readonly minCombinedScore?: number;      // Minimum composite threshold (e.g. 0.15)
  readonly allowedEpistemicStatuses?: readonly EpistemicStatus[];
  readonly referenceTime?: number;         // Reference timestamp for recency calculation (ms)
}

/**
 * Result of deterministic context relevance ranking.
 */
export interface RankingResult {
  readonly query: string;
  readonly tenantId: string;
  readonly rankedCandidates: readonly RankedCandidate[];
  readonly totalCandidatesEvaluated: number;
  readonly totalTokens: number;
  readonly latencyMs: number;
  readonly rankingDigest: string;          // Cryptographic SHA-256 digest of ranked order
}

// ─────────────────────────────────────────────────────────────────────────────
// Domain Errors
// ─────────────────────────────────────────────────────────────────────────────

export class RankingError extends Error {
  public readonly code: string;

  constructor(message: string, code: string) {
    super(`[ContextRelevanceRanking] ${message}`);
    this.name = 'RankingError';
    this.code = code;
  }
}

export class RankingTenantViolationError extends RankingError {
  public readonly expectedTenant: string;
  public readonly actualTenant: string;

  constructor(expectedTenant: string, actualTenant: string) {
    super(
      `Tenant Isolation Violation: Caller tenant "${expectedTenant}" attempted ranking candidate owned by tenant "${actualTenant}". Access blocked fail-closed.`,
      'RANKING_TENANT_VIOLATION'
    );
    this.name = 'RankingTenantViolationError';
    this.expectedTenant = expectedTenant;
    this.actualTenant = actualTenant;
  }
}

export class RankingActuationBlockedError extends RankingError {
  public readonly directive: string;

  constructor(directive: string) {
    super(
      `Hardware Actuation Blocked: Ranking governor rejected directive "${directive}". Physical actuation permanently prohibited.`,
      'HARDWARE_ACTUATION_PROHIBITED'
    );
    this.name = 'RankingActuationBlockedError';
    this.directive = directive;
  }
}

export class RankingCandidatePoolOverflowError extends RankingError {
  public readonly poolSize: number;
  public readonly maxAllowed: number;

  constructor(poolSize: number, maxAllowed: number) {
    super(
      `Candidate pool overflow: candidate pool size ${poolSize} exceeds maximum limit of ${maxAllowed}. Assembly halted fail-closed.`,
      'RANKING_POOL_OVERFLOW'
    );
    this.name = 'RankingCandidatePoolOverflowError';
    this.poolSize = poolSize;
    this.maxAllowed = maxAllowed;
  }
}

export class UnsupportedEpistemicPromotionError extends RankingError {
  public readonly objectId: string;
  public readonly status: string;

  constructor(objectId: string, status: string, reason: string) {
    super(
      `Unsupported epistemic promotion for object "${objectId}" (${status}): ${reason}. Speculative elevation blocked.`,
      'UNSUPPORTED_EPISTEMIC_PROMOTION'
    );
    this.name = 'UnsupportedEpistemicPromotionError';
    this.objectId = objectId;
    this.status = status;
  }
}

export class RankingBudgetExceededError extends RankingError {
  public readonly currentTokens: number;
  public readonly budgetLimit: number;

  constructor(currentTokens: number, budgetLimit: number) {
    super(
      `Token budget ceiling exceeded: requested ${currentTokens} tokens exceeds budget ceiling ${budgetLimit}.`,
      'RANKING_TOKEN_BUDGET_EXCEEDED'
    );
    this.name = 'RankingBudgetExceededError';
    this.currentTokens = currentTokens;
    this.budgetLimit = budgetLimit;
  }
}
