/**
 * CUBiO AI — Task 174: Hierarchical Context Memory
 * src/cubio/model/native_hierarchical_memory/hierarchicalCoordinator.ts
 *
 * Master Facade for Hierarchical Context Memory:
 * Orchestrates multi-tier store (L1/L2/L3), promotion/demotion engine,
 * deterministic retriever, and Primary VDB authority (L4).
 */

import * as crypto from 'crypto';
import {
  IS_ACTUATION_BLOCKED,
  MemoryLevel,
  HierarchicalReference,
  L1MaterializedEntry,
  HierarchicalConfig,
  HierarchicalRetrievalResult,
  LevelTransitionEvent,
  HierarchicalMemoryIntegrityError,
  HierarchicalMemoryTenantViolationError,
} from './types.js';
import { HierarchicalGovernor } from './hierarchicalGovernor.js';
import { HierarchicalStore } from './hierarchicalStore.js';
import { PromotionDemotionEngine, DEFAULT_HIERARCHICAL_CONFIG } from './promotionDemotionEngine.js';
import { HierarchicalRetriever } from './hierarchicalRetriever.js';
import { ModelMemoryCoordinator } from '../native_memory_integration/modelMemoryCoordinator.js';

export interface HierarchicalSnapshot {
  readonly tenantId: string;
  readonly snapshotTimestamp: string;
  readonly references: readonly HierarchicalReference[];
  readonly l1Entries: readonly L1MaterializedEntry[];
  readonly checksum: string; // SHA-256 of snapshot payload
}

export class HierarchicalCoordinator {
  private readonly store: HierarchicalStore;
  private readonly memoryCoord: ModelMemoryCoordinator;
  private readonly promotionEngine: PromotionDemotionEngine;
  private readonly retriever: HierarchicalRetriever;
  private readonly config: HierarchicalConfig;

  constructor(params?: {
    memoryCoord?: ModelMemoryCoordinator;
    config?: Partial<HierarchicalConfig>;
  }) {
    HierarchicalGovernor.assertActuationLockout();
    this.memoryCoord = params?.memoryCoord ?? new ModelMemoryCoordinator();
    this.store = new HierarchicalStore();
    this.config = Object.freeze({ ...DEFAULT_HIERARCHICAL_CONFIG, ...params?.config });
    this.promotionEngine = new PromotionDemotionEngine(this.store, this.memoryCoord, this.config);
    this.retriever = new HierarchicalRetriever(this.store, this.memoryCoord);
  }

  public getStore(): HierarchicalStore {
    return this.store;
  }

  public getMemoryCoordinator(): ModelMemoryCoordinator {
    return this.memoryCoord;
  }

  public getPromotionEngine(): PromotionDemotionEngine {
    return this.promotionEngine;
  }

  public getRetriever(): HierarchicalRetriever {
    return this.retriever;
  }

  public getConfig(): HierarchicalConfig {
    return this.config;
  }

  /**
   * Ingests a new context entity into the hierarchy.
   * If level is L1_LOCAL: materializes active tokens and persists to VDB.
   * If level is L2_SESSION or L3_LONG_TERM: persists to VDB and creates lightweight reference.
   */
  public ingest(params: {
    objectId: string;
    tenantId: string;
    content: string;
    level?: MemoryLevel;
    relevanceScore?: number;
    epistemicStatus?: string;
    spatialCellId?: number;
    isPinnedAnchor?: boolean;
    sourceDocId?: string;
    sessionId?: string;
  }): { reference: HierarchicalReference; materializedEntry?: L1MaterializedEntry } {
    HierarchicalGovernor.assertActuationLockout(params.content);

    const {
      objectId,
      tenantId,
      content,
      level = 'L2_SESSION',
      relevanceScore = 0.50,
      epistemicStatus = 'OBSERVATION',
      spatialCellId,
      isPinnedAnchor = false,
      sourceDocId,
      sessionId,
    } = params;

    const tokenCount = Math.max(1, Math.ceil(content.length / 4));
    const byteLength = Buffer.byteLength(content, 'utf8');
    const checksum = crypto.createHash('sha256').update(content).digest('hex');
    const cleanObjId = objectId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 12);
    const referenceId = `href_${tenantId.slice(0, 6)}_${cleanObjId}_${checksum.slice(0, 8)}_${Date.now().toString(36)}`;
    const summary = content.replace(/\s+/g, ' ').slice(0, 60).trim();

    // 1. Persist full authoritative payload in Primary VDB (L4)
    // Only promote to canonical if epistemicStatus is canonical and anchor is pinned
    const isCanonical =
      isPinnedAnchor && ['FACT', 'AXIOM', 'DERIVED'].includes(epistemicStatus.toUpperCase());

    this.memoryCoord.persistRecord(
      {
        objectId,
        tenantId,
        expectedVersion: 0,
        newContent: content,
        newSpatialCellId: spatialCellId,
        newEpistemicStatus: epistemicStatus,
        promoteToCanonical: isCanonical,
      },
      'hierarchical_context_ingest'
    );

    // 2. Build lightweight reference
    const reference: HierarchicalReference = Object.freeze({
      referenceId,
      objectId,
      level,
      tenantId,
      tokenCount,
      byteLength,
      checksum,
      relevanceScore,
      accessCount: 1,
      lastAccessedTimestamp: new Date().toISOString(),
      epistemicStatus,
      version: 1,
      spatialCellId,
      isPinnedAnchor,
      summary,
      provenance: Object.freeze({
        sourceDocId,
        sessionId,
        taskId: 'TASK_174_INGEST',
        createdAt: new Date().toISOString(),
      }),
    });

    let materializedEntry: L1MaterializedEntry | undefined = undefined;

    if (level === 'L1_LOCAL') {
      // Materialize active tokens
      const mockTokens = new Array(tokenCount).fill(0).map((_, i) => (checksum.charCodeAt(i % 32) + i) % 1000);
      materializedEntry = Object.freeze({
        referenceId,
        objectId,
        tenantId,
        tokens: Object.freeze(mockTokens),
        content,
        tokenCount,
        checksum,
        loadedAtTimestamp: new Date().toISOString(),
        isPinnedAnchor,
      });

      this.store.setL1Entry(materializedEntry, tenantId);
      // Also register reference
      this.store.putReference(reference, tenantId);

      // Check L1 token budget and demote if exceeded
      this.promotionEngine.enforceL1TokenBudget(tenantId);
    } else {
      // Store zero-copy reference in L2 or L3
      this.store.putReference(reference, tenantId);
      // Enforce level capacity
      this.promotionEngine.ensureCapacityForLevel(level, tenantId);
    }

    return { reference, materializedEntry };
  }

  /**
   * Cascaded hierarchical retrieval.
   */
  public queryHierarchy(params: {
    query: string;
    callerTenantId: string;
    maxTokens?: number;
    minScore?: number;
    materializeContent?: boolean;
    levelsToSearch?: readonly MemoryLevel[];
  }): HierarchicalRetrievalResult {
    HierarchicalGovernor.assertActuationLockout(params.query);
    return this.retriever.retrieve(params);
  }

  /**
   * Promotes a reference to a higher level.
   */
  public promote(params: {
    referenceId: string;
    targetLevel: MemoryLevel;
    callerTenantId: string;
    expectedVersion?: number;
    forceEpistemicVerification?: boolean;
  }): { reference: HierarchicalReference; event: LevelTransitionEvent } {
    HierarchicalGovernor.assertActuationLockout();
    return this.promotionEngine.promote(params);
  }

  /**
   * Demotes a reference to a lower level.
   */
  public demote(params: {
    referenceId: string;
    targetLevel: MemoryLevel;
    callerTenantId: string;
    reason?: string;
  }): { reference: HierarchicalReference; event: LevelTransitionEvent } {
    HierarchicalGovernor.assertActuationLockout();
    return this.promotionEngine.demote(params);
  }

  /**
   * Materializes an L2, L3, or L4 reference into L1 Local active memory.
   */
  public elevateToActiveL1(referenceId: string, callerTenantId: string): L1MaterializedEntry {
    HierarchicalGovernor.assertActuationLockout();
    const ref = this.store.getReference(referenceId, callerTenantId);
    if (!ref) {
      throw new Error(`Reference "${referenceId}" not found for tenant "${callerTenantId}".`);
    }

    // Materialize content from Primary VDB with checksum verification
    const content = this.retriever.materializeFromVDB(ref, callerTenantId);
    const mockTokens = new Array(ref.tokenCount).fill(0).map((_, i) => (ref.checksum.charCodeAt(i % 32) + i) % 1000);

    const l1Entry: L1MaterializedEntry = Object.freeze({
      referenceId: ref.referenceId,
      objectId: ref.objectId,
      tenantId: ref.tenantId,
      tokens: Object.freeze(mockTokens),
      content,
      tokenCount: ref.tokenCount,
      checksum: ref.checksum,
      loadedAtTimestamp: new Date().toISOString(),
      isPinnedAnchor: ref.isPinnedAnchor,
    });

    this.store.setL1Entry(l1Entry, callerTenantId);
    this.promotionEngine.enforceL1TokenBudget(callerTenantId);

    return l1Entry;
  }

  /**
   * Exports in-memory hierarchical state as a verified `.3dmemory` transport snapshot.
   */
  public exportSnapshot(callerTenantId: string): HierarchicalSnapshot {
    HierarchicalGovernor.assertActuationLockout();

    const l2Refs = this.store.getReferencesAtLevel('L2_SESSION', callerTenantId);
    const l3Refs = this.store.getReferencesAtLevel('L3_LONG_TERM', callerTenantId);
    const allRefs = [...l2Refs, ...l3Refs];
    const l1Entries = this.store.getAllL1Entries(callerTenantId);

    const hasher = crypto.createHash('sha256');
    hasher.update(`HIER_SNAP:${callerTenantId}:${allRefs.length}:${l1Entries.length}`);
    for (const r of allRefs) {
      hasher.update(`:${r.referenceId}:${r.checksum}:${r.level}:${r.version}`);
    }
    for (const e of l1Entries) {
      hasher.update(`:${e.referenceId}:${e.checksum}`);
    }
    const checksum = hasher.digest('hex');

    return Object.freeze({
      tenantId: callerTenantId,
      snapshotTimestamp: new Date().toISOString(),
      references: Object.freeze(allRefs),
      l1Entries: Object.freeze([...l1Entries]),
      checksum,
    });
  }

  /**
   * Restores a verified `.3dmemory` transport snapshot into in-memory hierarchy.
   */
  public restoreSnapshot(snapshot: HierarchicalSnapshot, callerTenantId: string): number {
    HierarchicalGovernor.assertActuationLockout();

    if (snapshot.tenantId !== callerTenantId) {
      throw new HierarchicalMemoryTenantViolationError(callerTenantId, snapshot.tenantId);
    }

    // Verify snapshot checksum
    const hasher = crypto.createHash('sha256');
    hasher.update(`HIER_SNAP:${snapshot.tenantId}:${snapshot.references.length}:${snapshot.l1Entries.length}`);
    for (const r of snapshot.references) {
      hasher.update(`:${r.referenceId}:${r.checksum}:${r.level}:${r.version}`);
    }
    for (const e of snapshot.l1Entries) {
      hasher.update(`:${e.referenceId}:${e.checksum}`);
    }
    const expectedChecksum = hasher.digest('hex');

    if (expectedChecksum !== snapshot.checksum) {
      throw new HierarchicalMemoryIntegrityError(
        'SNAPSHOT',
        `Snapshot checksum mismatch. Expected ${snapshot.checksum}, computed ${expectedChecksum}. Corruption detected.`
      );
    }

    // Restore references
    for (const ref of snapshot.references) {
      this.store.putReference(ref, callerTenantId);
    }

    // Restore L1 entries
    for (const entry of snapshot.l1Entries) {
      this.store.setL1Entry(entry, callerTenantId);
    }

    return snapshot.references.length + snapshot.l1Entries.length;
  }
}
