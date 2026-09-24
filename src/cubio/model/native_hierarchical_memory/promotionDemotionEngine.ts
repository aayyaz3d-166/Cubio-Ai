/**
 * CUBiO AI — Task 174: Hierarchical Context Memory
 * src/cubio/model/native_hierarchical_memory/promotionDemotionEngine.ts
 *
 * Promotion & Demotion Engine:
 * - Governed promotion based on relevance score, access frequency, and epistemic provenance.
 * - Epistemic anti-pollution guard: prevents non-canonical statuses from reaching L4.
 * - Bounded cache demotion & LRU eviction across L1, L2, and L3.
 * - Enforces OCC versioning and strict multi-tenant isolation.
 */

import {
  MemoryLevel,
  HierarchicalReference,
  HierarchicalConfig,
  LevelTransitionEvent,
  HierarchicalMemoryTenantViolationError,
  HierarchicalMemoryOCCConflictError,
  HierarchicalMemoryError,
} from './types.js';
import { HierarchicalStore } from './hierarchicalStore.js';
import { HierarchicalGovernor } from './hierarchicalGovernor.js';
import { ModelMemoryCoordinator } from '../native_memory_integration/modelMemoryCoordinator.js';

export const DEFAULT_HIERARCHICAL_CONFIG: HierarchicalConfig = Object.freeze({
  maxL1ActiveTokens: 2048,
  maxL2SessionRefs: 64,
  maxL3LongTermRefs: 256,
  l2ToL3PromotionMinRelevance: 0.70,
  l2ToL3PromotionMinAccessCount: 2,
  l3ToL4PromotionMinRelevance: 0.85,
  epistemicDecayFactor: 0.05,
});

export class PromotionDemotionEngine {
  private readonly store: HierarchicalStore;
  private readonly memoryCoord: ModelMemoryCoordinator;
  private readonly config: HierarchicalConfig;
  private readonly transitionLog: LevelTransitionEvent[] = [];

  constructor(
    store: HierarchicalStore,
    memoryCoord: ModelMemoryCoordinator,
    config?: Partial<HierarchicalConfig>
  ) {
    this.store = store;
    this.memoryCoord = memoryCoord;
    this.config = Object.freeze({ ...DEFAULT_HIERARCHICAL_CONFIG, ...config });
  }

  public getConfig(): HierarchicalConfig {
    return this.config;
  }

  public getTransitionLog(): readonly LevelTransitionEvent[] {
    return Object.freeze([...this.transitionLog]);
  }

  /**
   * Evaluates and executes promotion of a reference to a target memory tier.
   */
  public promote(params: {
    referenceId: string;
    targetLevel: MemoryLevel;
    callerTenantId: string;
    expectedVersion?: number;
    forceEpistemicVerification?: boolean;
  }): { reference: HierarchicalReference; event: LevelTransitionEvent } {
    const { referenceId, targetLevel, callerTenantId, expectedVersion } = params;

    const currentRef = this.store.getReference(referenceId, callerTenantId);
    if (!currentRef) {
      throw new HierarchicalMemoryError(
        `Reference "${referenceId}" not found for tenant "${callerTenantId}".`,
        'REFERENCE_NOT_FOUND'
      );
    }

    if (currentRef.tenantId !== callerTenantId) {
      throw new HierarchicalMemoryTenantViolationError(callerTenantId, currentRef.tenantId);
    }

    // Check OCC version
    if (expectedVersion !== undefined && currentRef.version !== expectedVersion) {
      throw new HierarchicalMemoryOCCConflictError(referenceId, expectedVersion, currentRef.version);
    }

    // 1. Guard against canonical pollution if target is L4
    if (targetLevel === 'L4_CANONICAL_VDB') {
      HierarchicalGovernor.assertCanonicalPromotionClearance(
        referenceId,
        targetLevel,
        currentRef.epistemicStatus
      );

      // Verify relevance meets threshold
      if (currentRef.relevanceScore < this.config.l3ToL4PromotionMinRelevance) {
        throw new HierarchicalMemoryError(
          `Reference "${referenceId}" relevance (${currentRef.relevanceScore.toFixed(2)}) is below L4 threshold (${this.config.l3ToL4PromotionMinRelevance}).`,
          'INSUFFICIENT_RELEVANCE_FOR_CANONICAL_PROMOTION'
        );
      }

      // Persist to authoritative Primary VDB with canonical promotion flag
      const record = this.memoryCoord.getRecord(currentRef.objectId, callerTenantId);
      const content = record ? record.content : currentRef.summary;
      this.memoryCoord.persistRecord(
        {
          objectId: currentRef.objectId,
          tenantId: currentRef.tenantId,
          expectedVersion: currentRef.version,
          newContent: content,
          newSpatialCellId: currentRef.spatialCellId,
          newEpistemicStatus: currentRef.epistemicStatus,
          promoteToCanonical: true,
        },
        'hierarchical_canonical_vdb'
      );
    } else if (targetLevel === 'L3_LONG_TERM') {
      // If promoting L2 -> L3, check relevance and access count unless forced
      const isQualified =
        currentRef.relevanceScore >= this.config.l2ToL3PromotionMinRelevance &&
        currentRef.accessCount >= this.config.l2ToL3PromotionMinAccessCount;

      if (!isQualified && !params.forceEpistemicVerification) {
        throw new HierarchicalMemoryError(
          `Reference "${referenceId}" does not qualify for L3 promotion (score: ${currentRef.relevanceScore}, accesses: ${currentRef.accessCount}).`,
          'INSUFFICIENT_QUALIFICATION_FOR_L3_PROMOTION'
        );
      }

      // Ensure L3 capacity before adding
      this.ensureCapacityForLevel('L3_LONG_TERM', callerTenantId);
    }

    // Remove from previous level
    this.store.removeReference(referenceId, currentRef.level, callerTenantId);

    // Update reference with new level
    const updatedRef: HierarchicalReference = {
      ...currentRef,
      level: targetLevel,
      lastAccessedTimestamp: new Date().toISOString(),
    };

    const saved = this.store.putReference(updatedRef, callerTenantId, currentRef.version);

    const event: LevelTransitionEvent = Object.freeze({
      referenceId,
      objectId: currentRef.objectId,
      tenantId: callerTenantId,
      fromLevel: currentRef.level,
      toLevel: targetLevel,
      triggerReason: `PROMOTION_TO_${targetLevel}`,
      oldVersion: currentRef.version,
      newVersion: saved.version,
      timestamp: new Date().toISOString(),
    });

    this.transitionLog.push(event);

    return { reference: saved, event };
  }

  /**
   * Demotes a reference to a lower tier or evicts it.
   */
  public demote(params: {
    referenceId: string;
    targetLevel: MemoryLevel;
    callerTenantId: string;
    reason?: string;
  }): { reference: HierarchicalReference; event: LevelTransitionEvent } {
    const { referenceId, targetLevel, callerTenantId, reason } = params;

    const currentRef = this.store.getReference(referenceId, callerTenantId);
    if (!currentRef) {
      throw new HierarchicalMemoryError(
        `Reference "${referenceId}" not found for tenant "${callerTenantId}".`,
        'REFERENCE_NOT_FOUND'
      );
    }

    if (currentRef.tenantId !== callerTenantId) {
      throw new HierarchicalMemoryTenantViolationError(callerTenantId, currentRef.tenantId);
    }

    // If demoting out of L1, remove materialized active tokens
    if (currentRef.level === 'L1_LOCAL') {
      this.store.removeL1Entry(referenceId, callerTenantId);
    }

    this.store.removeReference(referenceId, currentRef.level, callerTenantId);

    const updatedRef: HierarchicalReference = {
      ...currentRef,
      level: targetLevel,
      lastAccessedTimestamp: new Date().toISOString(),
    };

    const saved = this.store.putReference(updatedRef, callerTenantId, currentRef.version);

    const event: LevelTransitionEvent = Object.freeze({
      referenceId,
      objectId: currentRef.objectId,
      tenantId: callerTenantId,
      fromLevel: currentRef.level,
      toLevel: targetLevel,
      triggerReason: reason ?? `DEMOTION_TO_${targetLevel}`,
      oldVersion: currentRef.version,
      newVersion: saved.version,
      timestamp: new Date().toISOString(),
    });

    this.transitionLog.push(event);

    return { reference: saved, event };
  }

  /**
   * Enforces capacity on a tier by demoting or evicting lowest relevance / least recent items.
   */
  public ensureCapacityForLevel(level: MemoryLevel, callerTenantId: string): void {
    if (level === 'L2_SESSION') {
      const refs = [...this.store.getReferencesAtLevel('L2_SESSION', callerTenantId)];
      if (refs.length >= this.config.maxL2SessionRefs) {
        // Sort ascending by relevance score, then by lastAccessedTimestamp ascending (LRU)
        refs.sort((a, b) => {
          if (a.relevanceScore !== b.relevanceScore) return a.relevanceScore - b.relevanceScore;
          return a.lastAccessedTimestamp.localeCompare(b.lastAccessedTimestamp);
        });
        // Demote bottom reference to L3
        const candidate = refs[0];
        this.demote({
          referenceId: candidate.referenceId,
          targetLevel: 'L3_LONG_TERM',
          callerTenantId,
          reason: 'L2_CAPACITY_EXCEEDED_DEMOTION',
        });
      }
    } else if (level === 'L3_LONG_TERM') {
      const refs = [...this.store.getReferencesAtLevel('L3_LONG_TERM', callerTenantId)];
      if (refs.length >= this.config.maxL3LongTermRefs) {
        refs.sort((a, b) => {
          if (a.relevanceScore !== b.relevanceScore) return a.relevanceScore - b.relevanceScore;
          return a.lastAccessedTimestamp.localeCompare(b.lastAccessedTimestamp);
        });
        // Evict least relevant reference from in-memory L3
        const victim = refs[0];
        this.store.removeReference(victim.referenceId, 'L3_LONG_TERM', callerTenantId);
        this.transitionLog.push({
          referenceId: victim.referenceId,
          objectId: victim.objectId,
          tenantId: callerTenantId,
          fromLevel: 'L3_LONG_TERM',
          toLevel: 'L4_CANONICAL_VDB', // Retained in VDB if persistent, but evicted from RAM
          triggerReason: 'L3_CAPACITY_EXCEEDED_EVICTION',
          oldVersion: victim.version,
          newVersion: victim.version,
          timestamp: new Date().toISOString(),
        });
      }
    }
  }

  /**
   * Enforces L1 token budget by demoting excess entries to L2.
   */
  public enforceL1TokenBudget(callerTenantId: string): readonly string[] {
    const demotedIds: string[] = [];
    let currentTokens = this.store.getL1TotalActiveTokens(callerTenantId);

    if (currentTokens <= this.config.maxL1ActiveTokens) {
      return demotedIds;
    }

    const entries = [...this.store.getAllL1Entries(callerTenantId)];
    // Do not demote pinned anchors if possible
    entries.sort((a, b) => {
      if (a.isPinnedAnchor !== b.isPinnedAnchor) {
        return a.isPinnedAnchor ? 1 : -1;
      }
      return a.loadedAtTimestamp.localeCompare(b.loadedAtTimestamp); // Oldest first
    });

    for (const entry of entries) {
      if (currentTokens <= this.config.maxL1ActiveTokens) break;
      if (entry.isPinnedAnchor && entries.some(e => !e.isPinnedAnchor)) continue;

      this.demote({
        referenceId: entry.referenceId,
        targetLevel: 'L2_SESSION',
        callerTenantId,
        reason: 'L1_TOKEN_BUDGET_OVERFLOW_DEMOTION',
      });
      demotedIds.push(entry.referenceId);
      currentTokens -= entry.tokenCount;
    }

    return demotedIds;
  }
}
