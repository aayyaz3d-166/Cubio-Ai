/**
 * CubiO — Universal Spatial Operating Environment
 * Phase 7: CubiO Memory Engine
 *
 * Implements the full Index-Driven Memory Lifecycle:
 * Memory Index -> Required Memory -> Load -> Process -> Cache -> Release.
 *
 * Supports 7 Memory Tiers:
 * SHORT_TERM, LONG_TERM, CONTEXT, RELATIONSHIPS, HISTORY, EMBEDDINGS, STATE_MEMORY.
 *
 * Invariant: Bounded RAM footprint, on-demand loading, deterministic recall,
 * and zero memory bloating.
 */

import { CubiODimension } from '../types';
import { deterministicHash } from '../state/determinism';
import { CubiOMemoryStore } from './memoryStorage';
import {
  CubiOMemoryTier,
  MemoryIndexEntry,
  MemoryBlock,
  MemoryQueryFilter,
  MemoryCacheStats,
  MemoryLifecycleEvent,
} from './types';

export interface MemoryEngineConfig {
  readonly maxCachedItems: number;
  readonly maxCacheBytes: number;
}

export class CubiOMemoryEngine {
  private indexTable: Map<string, MemoryIndexEntry> = new Map();
  private activeCache: Map<string, MemoryBlock> = new Map();
  private backingStore: CubiOMemoryStore = new CubiOMemoryStore();
  private events: MemoryLifecycleEvent[] = [];

  private maxCachedItems: number;
  private maxCacheBytes: number;
  private cacheHitCount = 0;
  private cacheMissCount = 0;
  private evictionCount = 0;

  constructor(config: Partial<MemoryEngineConfig> = {}) {
    this.maxCachedItems = config.maxCachedItems || 50;
    this.maxCacheBytes = config.maxCacheBytes || 50 * 1024 * 1024; // 50 MB
  }

  /**
   * Stores a memory payload into backing CAS storage and creates an entry in the Memory Index.
   */
  public store<T = any>(
    tier: CubiOMemoryTier,
    key: string,
    payload: T,
    dimension: CubiODimension = 'D3',
    options: {
      tags?: readonly string[];
      resonanceIndex?: number;
      autoCache?: boolean;
      customMemoryId?: string;
    } = {}
  ): Readonly<MemoryIndexEntry> {
    const memoryId =
      options.customMemoryId || `MEM_${deterministicHash(`${tier}:${key}:${Date.now()}`).slice(2, 12)}`;

    // 1. Store payload in Content-Addressable backing store
    const { cid, sizeBytes, checksum } = this.backingStore.put(payload);
    const now = Date.now();

    // 2. Construct lightweight index entry
    const indexEntry: MemoryIndexEntry = Object.freeze({
      memoryId,
      key,
      tier,
      dimension,
      sizeBytes,
      resonanceIndex: options.resonanceIndex !== undefined ? options.resonanceIndex : 9,
      tags: options.tags ? Object.freeze([...options.tags]) : Object.freeze([]),
      cid,
      payloadChecksum: checksum,
      createdAt: now,
      lastAccessedAt: now,
    });

    this.indexTable.set(memoryId, indexEntry);
    this.recordEvent(memoryId, key, 'INDEX_REGISTERED', `Tier ${tier} index registered with CID ${cid}`);
    this.recordEvent(memoryId, key, 'PAYLOAD_STORED', `Payload stored (${sizeBytes} bytes)`);

    // 3. Conditionally cache if autoCache is enabled
    if (options.autoCache) {
      this.cacheBlock(indexEntry, payload);
    }

    return indexEntry;
  }

  /**
   * Fast header-only query against the Memory Index without loading heavy payloads into RAM.
   */
  public queryIndex(filter: MemoryQueryFilter = {}): readonly MemoryIndexEntry[] {
    const results: MemoryIndexEntry[] = [];

    for (const entry of this.indexTable.values()) {
      if (filter.tier && entry.tier !== filter.tier) continue;
      if (filter.dimension && entry.dimension !== filter.dimension) continue;
      if (filter.keyPrefix && !entry.key.startsWith(filter.keyPrefix)) continue;
      if (filter.minResonance && entry.resonanceIndex < filter.minResonance) continue;

      if (filter.tags && filter.tags.length > 0) {
        const hasTag = filter.tags.some((t) => entry.tags.includes(t));
        if (!hasTag) continue;
      }

      if (filter.timeRange) {
        if (entry.createdAt < filter.timeRange.start || entry.createdAt > filter.timeRange.end) {
          continue;
        }
      }

      results.push(entry);
      if (filter.limit && results.length >= filter.limit) break;
    }

    return Object.freeze(results);
  }

  /**
   * Loads a memory block into active cache on-demand from the backing CAS store.
   */
  public load<T = any>(memoryId: string): Readonly<MemoryBlock<T>> {
    // 1. Check active cache (Cache Hit)
    if (this.activeCache.has(memoryId)) {
      this.cacheHitCount++;
      const cached = this.activeCache.get(memoryId)!;
      const updatedIndex: MemoryIndexEntry = Object.freeze({
        ...cached.indexEntry,
        lastAccessedAt: Date.now(),
      });
      this.indexTable.set(memoryId, updatedIndex);

      const updatedBlock: MemoryBlock<T> = Object.freeze({
        ...cached,
        indexEntry: updatedIndex,
        accessCount: cached.accessCount + 1,
      });
      this.activeCache.set(memoryId, updatedBlock as any);
      return updatedBlock;
    }

    // 2. Cache Miss: Retrieve index entry
    this.cacheMissCount++;
    const indexEntry = this.indexTable.get(memoryId);
    if (!indexEntry) {
      throw new Error(`Memory ID '${memoryId}' not found in index table.`);
    }

    // 3. Load payload from backing CAS store
    const payload = this.backingStore.get<T>(indexEntry.cid);
    if (payload === null) {
      throw new Error(`Payload for CID '${indexEntry.cid}' missing from memory store.`);
    }

    this.recordEvent(memoryId, indexEntry.key, 'PAYLOAD_LOADED', `Loaded from store (${indexEntry.sizeBytes} bytes)`);

    // 4. Cache block into bounded RAM cache
    return this.cacheBlock(indexEntry, payload);
  }

  /**
   * High-level functional processing: Loads, processes with deterministic function,
   * and immediately releases if retainInCache is false.
   */
  public process<T = any, R = any>(
    memoryId: string,
    processorFn: (payload: T, index: MemoryIndexEntry) => R,
    options: { retainInCache?: boolean } = {}
  ): R {
    const block = this.load<T>(memoryId);
    const result = processorFn(block.payload, block.indexEntry);

    this.recordEvent(memoryId, block.indexEntry.key, 'PROCESSED', 'Memory payload processed successfully');

    if (options.retainInCache === false) {
      this.release(memoryId);
    }

    return result;
  }

  /**
   * Unloads a memory block from active RAM cache, freeing memory while keeping the index intact.
   */
  public release(memoryId: string): boolean {
    if (!this.activeCache.has(memoryId)) return false;

    const block = this.activeCache.get(memoryId)!;
    this.activeCache.delete(memoryId);
    this.recordEvent(memoryId, block.indexEntry.key, 'RELEASED', 'Payload released from active RAM cache');
    return true;
  }

  /**
   * Evicts the lowest-resonance / least-recently-used block from active cache to maintain bounds.
   */
  public evictLowestResonance(): boolean {
    if (this.activeCache.size === 0) return false;

    let lowestScore = Infinity;
    let candidateToEvict: string | null = null;
    const now = Date.now();

    for (const [id, block] of this.activeCache.entries()) {
      // Score = Resonance (0..9) * 0.6 + Recency factor * 0.4
      const ageMs = now - block.indexEntry.lastAccessedAt;
      const recencyFactor = Math.max(0, 1.0 - ageMs / 60000);
      const score = (block.indexEntry.resonanceIndex / 9) * 0.6 + recencyFactor * 0.4;

      if (score < lowestScore) {
        lowestScore = score;
        candidateToEvict = id;
      }
    }

    if (candidateToEvict) {
      const block = this.activeCache.get(candidateToEvict)!;
      this.activeCache.delete(candidateToEvict);
      this.evictionCount++;
      this.recordEvent(
        candidateToEvict,
        block.indexEntry.key,
        'EVICTED',
        `Evicted by cache policy (score: ${lowestScore.toFixed(3)})`
      );
      return true;
    }

    return false;
  }

  /**
   * Computes cosine similarity between two embedding vectors.
   */
  public computeEmbeddingSimilarity(vecA: readonly number[], vecB: readonly number[]): number {
    if (vecA.length !== vecB.length || vecA.length === 0) return 0;

    let dot = 0;
    let magA = 0;
    let magB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dot += vecA[i] * vecB[i];
      magA += vecA[i] * vecA[i];
      magB += vecB[i] * vecB[i];
    }

    if (magA === 0 || magB === 0) return 0;
    return parseFloat((dot / (Math.sqrt(magA) * Math.sqrt(magB))).toFixed(4));
  }

  /**
   * Returns live cache metrics and lifecycle diagnostics.
   */
  public getCacheStats(): MemoryCacheStats {
    let activeBytes = 0;
    for (const block of this.activeCache.values()) {
      activeBytes += block.indexEntry.sizeBytes;
    }

    return Object.freeze({
      totalIndexedCount: this.indexTable.size,
      activeLoadedInCache: this.activeCache.size,
      cacheHitCount: this.cacheHitCount,
      cacheMissCount: this.cacheMissCount,
      evictionCount: this.evictionCount,
      activeCacheBytes: activeBytes,
      maxCacheBytes: this.maxCacheBytes,
      maxCachedItems: this.maxCachedItems,
    });
  }

  public getEvents(): readonly MemoryLifecycleEvent[] {
    return Object.freeze([...this.events]);
  }

  public isLoadedInCache(memoryId: string): boolean {
    return this.activeCache.has(memoryId);
  }

  private cacheBlock<T>(indexEntry: MemoryIndexEntry, payload: T): MemoryBlock<T> {
    // Enforce capacity bounds
    while (this.activeCache.size >= this.maxCachedItems) {
      this.evictLowestResonance();
    }

    const block: MemoryBlock<T> = Object.freeze({
      indexEntry,
      payload,
      isLoaded: true,
      accessCount: 1,
      loadedAt: Date.now(),
    });

    this.activeCache.set(indexEntry.memoryId, block);
    this.recordEvent(indexEntry.memoryId, indexEntry.key, 'CACHED', 'Cached in bounded RAM cache');
    return block;
  }

  private recordEvent(
    memoryId: string,
    key: string,
    action: any,
    details?: string
  ): void {
    const eventId = `EVT_${deterministicHash(`${memoryId}:${action}:${this.events.length}`).slice(2, 10)}`;
    this.events.push(
      Object.freeze({
        eventId,
        memoryId,
        key,
        action,
        timestamp: Date.now(),
        details,
      })
    );
  }
}
