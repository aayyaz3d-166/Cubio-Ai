/**
 * CUBiO AI — Task 177: Context Relevance & Ranking
 * src/cubio/model/native_ranking/rankingCoordinator.ts
 *
 * Master coordinator orchestrating zero-copy context ranking over canonical
 * memory references and VDB records without bulk payload duplications.
 *
 * STRICT INVARIANTS:
 * 1. Zero-copy reference ranking: Retains lightweight candidate descriptors,
 *    storing references rather than copying full text bodies.
 * 2. Multi-tenant isolation verified before any scoring or selection.
 * 3. Primary VDB remains authoritative; .3dmemory is transport/backup only.
 * 4. Deterministic computation: A = B = C, delta = 0 across runs.
 * 5. Permanent hardware actuation lockout: IS_ACTUATION_BLOCKED === true.
 */

import {
  CanonicalMemoryReference,
  ModelMemoryRecord,
} from '../native_memory_integration/types.js';
import { NativeRanker } from './nativeRanker.js';
import { RankingGovernor } from './rankingGovernor.js';
import { ScoringEngine } from './scoringEngine.js';
import {
  CandidateDescriptor,
  DEFAULT_RANKING_WEIGHTS,
  EpistemicStatus,
  IS_ACTUATION_BLOCKED,
  RankingQuery,
  RankingResult,
  RankingWeights,
  TASK_177_ID,
} from './types.js';

export class RankingCoordinator {
  public readonly taskId: string = TASK_177_ID;
  public readonly isActuationBlocked: boolean = IS_ACTUATION_BLOCKED;

  private readonly ranker: NativeRanker;
  private readonly scoringEngine: ScoringEngine;
  private readonly governor: RankingGovernor;

  constructor(customWeights?: Partial<RankingWeights>) {
    this.scoringEngine = new ScoringEngine(customWeights ?? DEFAULT_RANKING_WEIGHTS);
    this.governor = new RankingGovernor();
    this.ranker = new NativeRanker(this.scoringEngine, this.governor);
  }

  /**
   * Convert a canonical memory reference into a lightweight candidate descriptor (zero-copy).
   */
  public descriptorFromReference(
    ref: CanonicalMemoryReference,
    epistemicStatus: EpistemicStatus = 'FACT',
    tokenCount?: number
  ): CandidateDescriptor {
    const timestampMs = new Date(ref.timestamp).getTime();
    const approxTokens = tokenCount ?? Math.max(1, Math.ceil(ref.contentLength / 4));

    return Object.freeze({
      objectId: ref.objectId,
      tenantId: ref.tenantId,
      tokenCount: approxTokens,
      epistemicStatus,
      spatialCellId: ref.spatialCellId,
      createdAt: isNaN(timestampMs) ? Date.now() : timestampMs,
      occVersion: ref.stateVersion,
      checksum: ref.checksum,
      isPinnedAnchor: ref.spatialCellId === 0 || epistemicStatus === 'AXIOM',
      domain: ref.domain,
      textPreview: ref.summary,
      terms: this.scoringEngine.tokenize(ref.summary),
    });
  }

  /**
   * Convert an authoritative VDB ModelMemoryRecord into a zero-copy candidate descriptor.
   * Does NOT duplicate the heavy content string into candidate memory.
   */
  public descriptorFromRecord(record: ModelMemoryRecord): CandidateDescriptor {
    const status = (record.epistemicStatus as EpistemicStatus) || 'FACT';
    const ref = record.reference;
    const timestampMs = new Date(ref.timestamp).getTime();
    const approxTokens = Math.max(1, Math.ceil(ref.contentLength / 4));

    // Hypothesis or observation cannot be pinned as anchor truth
    const isAnchor =
      record.isCanonicalKnowledge &&
      status !== 'HYPOTHESIS' &&
      status !== 'OBSERVATION' &&
      (status === 'AXIOM' || ref.spatialCellId === 0);

    return Object.freeze({
      objectId: ref.objectId,
      tenantId: ref.tenantId,
      tokenCount: approxTokens,
      epistemicStatus: status,
      spatialCellId: ref.spatialCellId,
      createdAt: isNaN(timestampMs) ? Date.now() : timestampMs,
      occVersion: ref.stateVersion,
      checksum: ref.checksum,
      isPinnedAnchor: isAnchor,
      domain: ref.domain,
      textPreview: ref.summary,
      terms: this.scoringEngine.tokenize(`${ref.summary} ${ref.domain}`),
    });
  }

  /**
   * Rank an array of candidate descriptors directly.
   */
  public rank(
    candidates: readonly CandidateDescriptor[],
    query: RankingQuery
  ): RankingResult {
    return this.ranker.rank(candidates, query);
  }

  /**
   * Rank a collection of CanonicalMemoryReference objects.
   */
  public rankReferences(
    refs: readonly { ref: CanonicalMemoryReference; epistemicStatus?: EpistemicStatus; tokenCount?: number }[],
    query: RankingQuery
  ): RankingResult {
    const candidates = refs.map((item) =>
      this.descriptorFromReference(item.ref, item.epistemicStatus, item.tokenCount)
    );
    return this.ranker.rank(candidates, query);
  }

  /**
   * Rank a collection of authoritative VDB ModelMemoryRecords without duplicating payloads.
   */
  public rankRecords(
    records: readonly ModelMemoryRecord[],
    query: RankingQuery
  ): RankingResult {
    const candidates = records.map((rec) => this.descriptorFromRecord(rec));
    return this.ranker.rank(candidates, query);
  }

  public getGovernor(): RankingGovernor {
    return this.governor;
  }

  public getScoringEngine(): ScoringEngine {
    return this.scoringEngine;
  }

  public getRanker(): NativeRanker {
    return this.ranker;
  }
}
