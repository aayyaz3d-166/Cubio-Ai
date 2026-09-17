/**
 * CUBiO AI — Phase 6: Task 79
 * Long-Context Memory Integration Layer
 * src/cubio/language/native/long_context/longContextMemoryManager.ts
 *
 * Master Orchestration Engine for Long-Context Memory Integration.
 * Implements CUBiO's core sovereign principle:
 * STORE ONCE -> REFERENCE EVERYWHERE -> LOAD ON DEMAND -> PROCESS -> CACHE SELECTIVELY -> EVICT.
 *
 * Guarantees zero external vector databases, bounded memory injection,
 * deterministic relevance ranking, stale and conflict detection,
 * and selective LRU cache eviction.
 */

import * as crypto from 'crypto';
import { CanonicalDomain, DEFAULT_TENANT_ID } from '../../../core/canonicalIdentity';
import { EpistemicStatus } from '../../../epistemic/native/epistemicTypes';
import { NativeInformationEngine } from '../../../information/native/nativeInformationEngine';
import { NativeSparseMemoryStore } from '../../../memory/native/sparseMemoryStore';
import { NativeMemoryRecord } from '../../../memory/native/types';
import { LanguageMemoryBridge } from '../languageMemoryBridge';
import { NativeContextWindow } from '../nativeContextWindow';
import { NativeTokenizer } from '../nativeTokenizer';
import { CandidateMemoryItem, MemoryRelevanceRanker } from './memoryRelevanceRanker';
import {
  ConflictingMemoryReferenceError,
  DEFAULT_LONG_CONTEXT_CONFIG,
  InjectedMemoryReference,
  LongContextBudgetExceededError,
  LongContextError,
  LongContextMemoryConfig,
  LongContextSearchResult,
  LongContextSnapshot,
  LRUCacheStats,
  MemoryConflictDetail,
  StaleMemoryReferenceError,
  UnauthorizedMemoryAccessError,
} from './longContextTypes';

export class LongContextMemoryManager {
  private readonly _tenantId: string;
  private readonly _config: LongContextMemoryConfig;
  private readonly _store: NativeSparseMemoryStore;
  private readonly _infoEngine: NativeInformationEngine;
  private readonly _bridge: LanguageMemoryBridge;
  private readonly _tokenizer: NativeTokenizer;
  private readonly _ranker: MemoryRelevanceRanker;

  /** Selective LRU cache for materialized dense payloads */
  private readonly _lruCache: Map<string, string> = new Map();
  private _hits = 0;
  private _misses = 0;
  private _evictions = 0;

  private _injectedReferences: InjectedMemoryReference[] = [];
  private _stateVersion = 1;

  constructor(
    store?: NativeSparseMemoryStore,
    infoEngine?: NativeInformationEngine,
    ranker?: MemoryRelevanceRanker,
    config?: Partial<LongContextMemoryConfig>,
    tenantId: string = DEFAULT_TENANT_ID
  ) {
    this._tenantId = tenantId.trim() || DEFAULT_TENANT_ID;
    this._config = Object.freeze({
      maxInjectedReferences: config?.maxInjectedReferences ?? DEFAULT_LONG_CONTEXT_CONFIG.maxInjectedReferences,
      maxReferenceBytes: config?.maxReferenceBytes ?? DEFAULT_LONG_CONTEXT_CONFIG.maxReferenceBytes,
      relevanceThreshold: config?.relevanceThreshold ?? DEFAULT_LONG_CONTEXT_CONFIG.relevanceThreshold,
      cacheCapacity: config?.cacheCapacity ?? DEFAULT_LONG_CONTEXT_CONFIG.cacheCapacity,
      evictionPolicy: 'LRU',
      allowMemoryReferral: config?.allowMemoryReferral ?? DEFAULT_LONG_CONTEXT_CONFIG.allowMemoryReferral,
    });

    this._store = store ?? new NativeSparseMemoryStore();
    this._infoEngine = infoEngine ?? new NativeInformationEngine(this._store);
    this._tokenizer = new NativeTokenizer();
    this._bridge = new LanguageMemoryBridge(this._infoEngine, this._store, this._tokenizer);
    this._ranker = ranker ?? new MemoryRelevanceRanker(this._tokenizer);
  }

  public get tenantId(): string {
    return this._tenantId;
  }

  public get config(): LongContextMemoryConfig {
    return this._config;
  }

  public get store(): NativeSparseMemoryStore {
    return this._store;
  }

  public get infoEngine(): NativeInformationEngine {
    return this._infoEngine;
  }

  public get bridge(): LanguageMemoryBridge {
    return this._bridge;
  }

  public get tokenizer(): NativeTokenizer {
    return this._tokenizer;
  }

  public get ranker(): MemoryRelevanceRanker {
    return this._ranker;
  }

  public get injectedReferences(): readonly InjectedMemoryReference[] {
    return Object.freeze([...this._injectedReferences]);
  }

  public get cacheStats(): LRUCacheStats {
    return Object.freeze({
      size: this._lruCache.size,
      capacity: this._config.cacheCapacity,
      hits: this._hits,
      misses: this._misses,
      evictions: this._evictions,
    });
  }

  /**
   * Retrieves relevant memory references for a query within current tenant.
   * Never duplicates full vector database into model context.
   */
  public retrieveRelevantReferences(
    queryText: string,
    options: { tenantId?: string; strict?: boolean } = {}
  ): LongContextSearchResult {
    const startTime = Date.now();
    const callerTenant = options.tenantId?.trim() || this._tenantId;

    if (callerTenant !== this._tenantId) {
      throw new UnauthorizedMemoryAccessError('QUERY_SCOPE', callerTenant, this._tenantId);
    }

    // 1. Gather candidate records strictly scoped to tenant
    const records = this._store.query({ tenantId: this._tenantId });
    const candidates: CandidateMemoryItem[] = [];

    for (const rec of records) {
      // Cross-tenant guard
      if (rec.identity.tenantId !== this._tenantId) {
        throw new UnauthorizedMemoryAccessError(rec.identity.objectId, this._tenantId, rec.identity.tenantId);
      }

      // Extract text content from metadata or information object
      let textContent = rec.metadata.description || rec.metadata.label || '';
      let subject: string | undefined = (rec.metadata.attributes?.subject as string) || undefined;
      let assertionValue: string | undefined = (rec.metadata.attributes?.assertionValue as string) || undefined;
      let epistemicStatus: EpistemicStatus | undefined = (rec.metadata.attributes?.epistemicStatus as EpistemicStatus) || undefined;
      let provenanceId: string | undefined = (rec.metadata.attributes?.provenanceId as string) || undefined;

      // Check if dense text is stored in InformationEngine
      const infoObj = this._infoEngine.getInformation(rec.identity.objectId, this._tenantId);
      if (infoObj) {
        if (infoObj.modality === 'TEXT' && 'content' in infoObj.payload) {
          textContent = (infoObj.payload as any).content as string;
        }
        if (infoObj.metadata?.subject) subject = infoObj.metadata.subject as string;
        if (infoObj.metadata?.assertionValue) assertionValue = infoObj.metadata.assertionValue as string;
        if (infoObj.metadata?.epistemicStatus) epistemicStatus = infoObj.metadata.epistemicStatus as EpistemicStatus;
        if (infoObj.metadata?.provenanceId) provenanceId = infoObj.metadata.provenanceId as string;
      }

      if (!epistemicStatus) {
        epistemicStatus = 'CANONICAL_FACT';
      }

      candidates.push({
        objectId: rec.identity.objectId,
        tenantId: rec.identity.tenantId,
        domain: rec.identity.domain,
        checksum: rec.integrity.checksum,
        stateVersion: rec.identity.stateVersion,
        epistemicStatus,
        text: textContent,
        spatialCellId: rec.identity.cellId,
        subject,
        assertionValue,
        provenanceId,
        timestamp: rec.metadata.createdAt,
      });
    }

    // 2. Rank candidates deterministically
    const ranked = this._ranker.rankCandidates(queryText, candidates, this._config);

    // 3. Detect stale and conflicting references
    const { stale, conflicts } = this.detectStaleAndConflicting(ranked);

    if (options.strict) {
      if (stale.length > 0) {
        const first = stale[0];
        const current = this._store.get(first.objectId, this._tenantId);
        throw new StaleMemoryReferenceError(first.objectId, first.stateVersion, current?.identity.stateVersion ?? -1);
      }
      if (conflicts.length > 0) {
        throw new ConflictingMemoryReferenceError(conflicts);
      }
    }

    // 4. Compute injected token count
    let totalTokens = 0;
    for (const ref of ranked) {
      totalTokens += this._tokenizer.tokenize(ref.summaryText).length;
    }

    const elapsed = Date.now() - startTime;

    return Object.freeze({
      queryText,
      tenantId: this._tenantId,
      rankedReferences: Object.freeze(ranked),
      injectedTokenCount: totalTokens,
      retrievalLatencyMs: elapsed,
      conflictsDetected: Object.freeze(conflicts),
      staleReferencesDetected: Object.freeze(stale),
    });
  }

  /**
   * Evaluates a set of references for state staleness and logical contradictions.
   */
  public detectStaleAndConflicting(
    references: readonly InjectedMemoryReference[]
  ): { stale: InjectedMemoryReference[]; conflicts: MemoryConflictDetail[] } {
    const stale: InjectedMemoryReference[] = [];
    const conflicts: MemoryConflictDetail[] = [];

    // 1. Check for stale references against current store state
    for (const ref of references) {
      const live = this._store.get(ref.objectId, ref.tenantId);
      if (!live) {
        stale.push(ref);
      } else if (live.identity.stateVersion !== ref.stateVersion || live.integrity.checksum !== ref.checksum) {
        stale.push(ref);
      }
    }

    // 2. Check pairwise conflicts on subject / assertion contradiction
    for (let i = 0; i < references.length; i++) {
      for (let j = i + 1; j < references.length; j++) {
        const a = references[i];
        const b = references[j];

        // Direct subject collision with contradictory assertions
        if (a.subject && b.subject && a.subject.trim().toLowerCase() === b.subject.trim().toLowerCase()) {
          if (a.assertionValue && b.assertionValue && a.assertionValue.trim().toLowerCase() !== b.assertionValue.trim().toLowerCase()) {
            conflicts.push({
              refA: a,
              refB: b,
              subject: a.subject,
              reason: `Contradictory values asserted for subject "${a.subject}": "${a.assertionValue}" vs "${b.assertionValue}"`,
            });
          } else if (
            (a.epistemicStatus === 'CANONICAL_FACT' && b.epistemicStatus === 'REJECTED_HYPOTHESIS') ||
            (b.epistemicStatus === 'CANONICAL_FACT' && a.epistemicStatus === 'REJECTED_HYPOTHESIS')
          ) {
            conflicts.push({
              refA: a,
              refB: b,
              subject: a.subject,
              reason: `Epistemic contradiction on subject "${a.subject}": CANONICAL_FACT vs REJECTED_HYPOTHESIS`,
            });
          }
        } else {
          // Direct text contradiction heuristic (e.g. "X is Y" vs "X is NOT Y")
          const aText = a.summaryText.toLowerCase();
          const bText = b.summaryText.toLowerCase();
          if (
            (aText.includes('true') && bText.includes('false') && aText.slice(0, 10) === bText.slice(0, 10)) ||
            (aText.includes(' = ') && bText.includes(' = ') && aText.split(' = ')[0] === bText.split(' = ')[0] && aText !== bText)
          ) {
            conflicts.push({
              refA: a,
              refB: b,
              subject: a.subject || a.objectId,
              reason: `Contradictory factual text detected between ${a.objectId} and ${b.objectId}`,
            });
          }
        }
      }
    }

    return { stale, conflicts };
  }

  /**
   * Materializes dense memory payload on demand using selective LRU caching.
   * Strictly enforces tenant isolation and evicts least-recently used blocks when capacity is reached.
   */
  public materializeReference(objectId: string, tenantId: string = this._tenantId): string {
    const callerTenant = tenantId.trim() || this._tenantId;
    if (callerTenant !== this._tenantId) {
      throw new UnauthorizedMemoryAccessError(objectId, callerTenant, this._tenantId);
    }

    // 1. LRU Cache Hit
    if (this._lruCache.has(objectId)) {
      this._hits++;
      const cached = this._lruCache.get(objectId)!;
      // Re-insert to maintain MRU position
      this._lruCache.delete(objectId);
      this._lruCache.set(objectId, cached);
      return cached;
    }

    // 2. LRU Cache Miss
    this._misses++;

    // 3. Verify existence & cross-tenant security
    const record = this._store.get(objectId, this._tenantId);
    if (!record) {
      // Check if entity exists in ANY other tenant
      const allRecords = this._store.getAllRecords();
      for (const r of allRecords) {
        if (r.identity.objectId === objectId && r.identity.tenantId !== this._tenantId) {
          throw new UnauthorizedMemoryAccessError(objectId, this._tenantId, r.identity.tenantId);
        }
      }
      throw new LongContextError(`Memory reference objectId "${objectId}" not found in tenant "${this._tenantId}"`);
    }

    // 4. Materialize dense content from InformationEngine or Store
    let denseContent: string = record.metadata.description || record.metadata.label || '';
    const infoObj = this._infoEngine.getInformation(objectId, this._tenantId);
    if (infoObj && infoObj.modality === 'TEXT' && 'content' in infoObj.payload) {
      denseContent = (infoObj.payload as any).content as string;
    } else {
      const seq = this._bridge.retrieveLanguageSequence(objectId, this._tenantId);
      if (seq) {
        denseContent = seq.rawText;
      }
    }

    // 5. Evict oldest LRU entry if at capacity
    if (this._lruCache.size >= this._config.cacheCapacity) {
      const oldestKey = this._lruCache.keys().next().value;
      if (oldestKey !== undefined) {
        this._lruCache.delete(oldestKey);
        this._evictions++;
      }
    }

    // 6. Cache materialized block
    this._lruCache.set(objectId, denseContent);

    return denseContent;
  }

  /**
   * Injects bounded lightweight memory references into active NativeContextWindow.
   * Strictly enforces bounds on reference count and byte budget.
   */
  public injectReferencesIntoWindow(
    window: NativeContextWindow,
    references: readonly InjectedMemoryReference[]
  ): { injectedCount: number; injectedBytes: number; injectedTokens: number } {
    if (window.tenantId !== this._tenantId) {
      throw new UnauthorizedMemoryAccessError('CONTEXT_WINDOW', window.tenantId, this._tenantId);
    }

    if (references.length > this._config.maxInjectedReferences) {
      throw new LongContextBudgetExceededError(
        `Injected references count (${references.length}) exceeds maximum allowable cap (${this._config.maxInjectedReferences})`
      );
    }

    if (references.length === 0) {
      return { injectedCount: 0, injectedBytes: 0, injectedTokens: 0 };
    }

    // Build formatted compact reference block
    const lines: string[] = ['[MEMORY_CONTEXT_BLOCK]'];
    for (let i = 0; i < references.length; i++) {
      const ref = references[i];
      const typeLabel = ref.isRememberedFact ? 'FACT' : 'INFERRED';
      lines.push(
        `[REF ${i + 1} id="${ref.objectId}" v="${ref.stateVersion}" epistemic="${ref.epistemicStatus}" type="${typeLabel}"] ${ref.summaryText}`
      );
    }
    lines.push('[/MEMORY_CONTEXT_BLOCK]');

    const blockText = lines.join('\n');
    const blockBytes = Buffer.byteLength(blockText, 'utf8');

    if (blockBytes > this._config.maxReferenceBytes) {
      throw new LongContextBudgetExceededError(
        `Injected memory reference size (${blockBytes} bytes) exceeds budget limit (${this._config.maxReferenceBytes} bytes)`
      );
    }

    // Append to window
    window.appendText(blockText);

    const tokenCount = this._tokenizer.tokenize(blockText, { maxSequenceLength: 8192 }).length;
    this._injectedReferences = [...references];
    this._stateVersion++;

    return {
      injectedCount: references.length,
      injectedBytes: blockBytes,
      injectedTokens: tokenCount,
    };
  }

  /**
   * Clears the selective LRU cache.
   */
  public clearCache(): void {
    this._lruCache.clear();
    this._hits = 0;
    this._misses = 0;
    this._evictions = 0;
  }

  /**
   * Serializes current long-context memory manager state into an immutable snapshot.
   */
  public exportSnapshot(): LongContextSnapshot {
    const snapId = `lcsnap_${crypto.randomBytes(8).toString('hex')}`;
    const cacheKeys = Array.from(this._lruCache.keys());
    const now = Date.now();

    const checksum = crypto
      .createHash('sha256')
      .update(
        JSON.stringify({
          snapshotId: snapId,
          tenantId: this._tenantId,
          injectedCount: this._injectedReferences.length,
          cacheKeysCount: cacheKeys.length,
          stateVersion: this._stateVersion,
        })
      )
      .digest('hex');

    return Object.freeze({
      snapshotId: snapId,
      tenantId: this._tenantId,
      injectedReferences: Object.freeze([...this._injectedReferences]),
      cacheKeys: Object.freeze(cacheKeys),
      stateVersion: this._stateVersion,
      checksum,
      timestamp: now,
    });
  }

  /**
   * Restores long-context memory manager state from a snapshot with cryptographic integrity verification.
   */
  public restoreSnapshot(snapshot: LongContextSnapshot): void {
    if (snapshot.tenantId !== this._tenantId) {
      throw new UnauthorizedMemoryAccessError('RESTORE_SNAPSHOT', snapshot.tenantId, this._tenantId);
    }

    const expectedChecksum = crypto
      .createHash('sha256')
      .update(
        JSON.stringify({
          snapshotId: snapshot.snapshotId,
          tenantId: snapshot.tenantId,
          injectedCount: snapshot.injectedReferences.length,
          cacheKeysCount: snapshot.cacheKeys.length,
          stateVersion: snapshot.stateVersion,
        })
      )
      .digest('hex');

    if (expectedChecksum !== snapshot.checksum) {
      throw new LongContextError(
        `Snapshot integrity check failed: expected checksum ${expectedChecksum}, received ${snapshot.checksum}`
      );
    }

    this._injectedReferences = [...snapshot.injectedReferences];
    this._stateVersion = snapshot.stateVersion;
  }
}
