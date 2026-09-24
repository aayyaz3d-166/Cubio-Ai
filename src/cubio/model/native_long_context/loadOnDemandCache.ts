/**
 * CUBiO AI — Task 171: Native Long-Context Architecture
 * src/cubio/model/native_long_context/loadOnDemandCache.ts
 *
 * Bounded LRU working memory cache for long-context blocks.
 * Loads content on demand from authoritative VDB storage and evicts inactive blocks
 * to strictly preserve edge/desktop memory limits (<= 64 MB resident RAM).
 */

import * as crypto from 'crypto';
import {
  LongContextIndexEntry,
  LongContextResidentBlock,
  LongContextResourceExceededError,
  LongContextIntegrityError,
} from './types';

export interface CacheConfig {
  readonly maxResidentBlocks: number;
  readonly maxResidentRamBytes: number;
}

export type BlockContentLoader = (entry: LongContextIndexEntry) => string | Promise<string>;

export class LoadOnDemandCache {
  private readonly config: CacheConfig;
  private readonly residentMap = new Map<string, LongContextResidentBlock>();

  // LRU doubly-linked list or ordered keys tracking
  // In modern V8, Map preserves insertion order; deleting and re-inserting moves to the end (MRU).
  private residentBytes = 0;
  private cacheHits = 0;
  private cacheMisses = 0;
  private evictionsCount = 0;

  constructor(config: CacheConfig) {
    this.config = Object.freeze({ ...config });
  }

  /**
   * Retrieves a block from resident memory, or loads it on demand via loader.
   */
  public async getOrLoad(
    entry: LongContextIndexEntry,
    loader: BlockContentLoader
  ): Promise<LongContextResidentBlock> {
    const chunkId = entry.chunkId;

    // 1. Cache Hit
    if (this.residentMap.has(chunkId)) {
      const block = this.residentMap.get(chunkId)!;
      block.lastAccessedAt = Date.now();
      block.accessCount++;

      // Refresh LRU position (delete and re-insert)
      this.residentMap.delete(chunkId);
      this.residentMap.set(chunkId, block);

      this.cacheHits++;
      return block;
    }

    // 2. Cache Miss: Load on demand
    this.cacheMisses++;
    const rawContent = await loader(entry);

    // Verify bitwise checksum against canonical index
    const computedChecksum = crypto.createHash('sha256').update(rawContent).digest('hex');
    if (computedChecksum !== entry.checksum) {
      throw new LongContextIntegrityError(
        `Checksum verification failed for chunk "${chunkId}". Expected ${entry.checksum}, computed ${computedChecksum}. Content tampering detected.`
      );
    }

    const blockBytes = Buffer.byteLength(rawContent, 'utf8');

    // 3. Ensure capacity before inserting
    this.evictToFit(blockBytes);

    const residentBlock: LongContextResidentBlock = {
      entry,
      content: rawContent,
      loadedAt: Date.now(),
      lastAccessedAt: Date.now(),
      accessCount: 1,
    };

    this.residentMap.set(chunkId, residentBlock);
    this.residentBytes += blockBytes;

    return residentBlock;
  }

  /**
   * Synchronous version when loader is synchronous.
   */
  public getOrLoadSync(
    entry: LongContextIndexEntry,
    loader: (entry: LongContextIndexEntry) => string
  ): LongContextResidentBlock {
    const chunkId = entry.chunkId;

    if (this.residentMap.has(chunkId)) {
      const block = this.residentMap.get(chunkId)!;
      block.lastAccessedAt = Date.now();
      block.accessCount++;
      this.residentMap.delete(chunkId);
      this.residentMap.set(chunkId, block);
      this.cacheHits++;
      return block;
    }

    this.cacheMisses++;
    const rawContent = loader(entry);

    const computedChecksum = crypto.createHash('sha256').update(rawContent).digest('hex');
    if (computedChecksum !== entry.checksum) {
      throw new LongContextIntegrityError(
        `Checksum mismatch on chunk "${chunkId}". Expected ${entry.checksum}, computed ${computedChecksum}.`
      );
    }

    const blockBytes = Buffer.byteLength(rawContent, 'utf8');
    this.evictToFit(blockBytes);

    const residentBlock: LongContextResidentBlock = {
      entry,
      content: rawContent,
      loadedAt: Date.now(),
      lastAccessedAt: Date.now(),
      accessCount: 1,
    };

    this.residentMap.set(chunkId, residentBlock);
    this.residentBytes += blockBytes;

    return residentBlock;
  }

  /**
   * Checks if a block is currently resident in RAM.
   */
  public isResident(chunkId: string): boolean {
    return this.residentMap.has(chunkId);
  }

  /**
   * Evicts least recently used non-pinned blocks until limits are satisfied.
   */
  private evictToFit(incomingBytes: number): void {
    // If incoming block alone exceeds maximum resident budget, throw error
    if (incomingBytes > this.config.maxResidentRamBytes) {
      throw new LongContextResourceExceededError(
        'BLOCK_SIZE_EXCEEDS_RAM_CAP',
        incomingBytes,
        this.config.maxResidentRamBytes
      );
    }

    // Evict while block count >= maxResidentBlocks OR (residentBytes + incomingBytes) > maxResidentRamBytes
    while (
      this.residentMap.size >= this.config.maxResidentBlocks ||
      this.residentBytes + incomingBytes > this.config.maxResidentRamBytes
    ) {
      // Find least recently used non-pinned entry (first in Map iteration)
      let evictedKey: string | null = null;
      for (const [key, block] of this.residentMap.entries()) {
        if (!block.entry.isPinned) {
          evictedKey = key;
          break;
        }
      }

      // If all resident blocks are pinned, we must evict the oldest pinned block as fail-closed fallback
      if (!evictedKey) {
        evictedKey = this.residentMap.keys().next().value ?? null;
      }

      if (!evictedKey) {
        break; // Empty map
      }

      const evictedBlock = this.residentMap.get(evictedKey)!;
      const evictedBytes = Buffer.byteLength(evictedBlock.content, 'utf8');

      this.residentMap.delete(evictedKey);
      this.residentBytes = Math.max(0, this.residentBytes - evictedBytes);
      this.evictionsCount++;
    }
  }

  /**
   * Returns telemetry metrics.
   */
  public getTelemetry(): {
    residentBlocksCount: number;
    residentBytes: number;
    cacheHits: number;
    cacheMisses: number;
    evictionsCount: number;
    hitRate: number;
    isWithinBudget: boolean;
  } {
    const totalRequests = this.cacheHits + this.cacheMisses;
    const hitRate = totalRequests > 0 ? this.cacheHits / totalRequests : 0;
    const isWithinBudget = this.residentBytes <= this.config.maxResidentRamBytes;

    return Object.freeze({
      residentBlocksCount: this.residentMap.size,
      residentBytes: this.residentBytes,
      cacheHits: this.cacheHits,
      cacheMisses: this.cacheMisses,
      evictionsCount: this.evictionsCount,
      hitRate,
      isWithinBudget,
    });
  }

  /**
   * Clears resident RAM cache.
   */
  public clear(): void {
    this.residentMap.clear();
    this.residentBytes = 0;
    this.cacheHits = 0;
    this.cacheMisses = 0;
    this.evictionsCount = 0;
  }
}
