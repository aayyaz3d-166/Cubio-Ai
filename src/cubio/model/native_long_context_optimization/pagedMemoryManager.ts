/**
 * CUBiO AI — Task 181: Long-Context Efficiency & Resource Optimization
 * src/cubio/model/native_long_context_optimization/pagedMemoryManager.ts
 *
 * Bounded Paged Context Memory Manager:
 * Allocates and caches paged context tiles on demand with deterministic
 * LRU/LFU hybrid eviction, preventing uncontrolled cache growth and heap exhaustion.
 *
 * STRICT INVARIANTS:
 * 1. Hard ceilings on tile count and heap bytes; never exceeds limits.
 * 2. Deterministic eviction: oldest/least-frequently accessed tile evicted first.
 * 3. Strict tenant isolation: tiles keyed and partitioned by tenantId.
 */

import {
  DEFAULT_MAX_CACHED_TILES,
  DEFAULT_MAX_HEAP_BYTES,
  OptimizationTenantViolationError,
  PagedContextTile,
  ResourceLimitExceededError,
  UncontrolledCacheGrowthError,
} from './types.js';

export class PagedMemoryManager {
  private readonly maxCachedTiles: number;
  private readonly maxHeapBytes: number;

  // Active paged tiles: key = `${tenantId}:${tileId}`
  private readonly tiles = new Map<string, PagedContextTile>();

  private currentHeapBytes = 0;
  private hitCount = 0;
  private missCount = 0;
  private evictionCount = 0;

  constructor(maxCachedTiles: number = DEFAULT_MAX_CACHED_TILES, maxHeapBytes: number = DEFAULT_MAX_HEAP_BYTES) {
    this.maxCachedTiles = maxCachedTiles;
    this.maxHeapBytes = maxHeapBytes;
  }

  /**
   * Store or update a paged tile in the bounded memory manager.
   */
  public storeTile(tile: PagedContextTile): void {
    const key = `${tile.tenantId}:${tile.tileId}`;

    // If tile itself exceeds maximum allowable heap limit, reject immediately
    if (tile.byteSize > this.maxHeapBytes) {
      throw new ResourceLimitExceededError(tile.byteSize, this.maxHeapBytes, 'bytes');
    }

    // If updating existing tile, subtract its old size
    const existing = this.tiles.get(key);
    if (existing) {
      this.currentHeapBytes -= existing.byteSize;
    }

    // Evict tiles until both count and byte constraints are satisfied
    while (
      (this.tiles.size >= this.maxCachedTiles && !this.tiles.has(key)) ||
      this.currentHeapBytes + tile.byteSize > this.maxHeapBytes
    ) {
      if (this.tiles.size === 0) {
        throw new UncontrolledCacheGrowthError(this.tiles.size, this.maxCachedTiles);
      }
      this.evictLeastValuableTile();
    }

    this.tiles.set(key, Object.freeze({ ...tile }));
    this.currentHeapBytes += tile.byteSize;
  }

  /**
   * Retrieve a paged tile with tenant isolation check and update access stats.
   */
  public getTile(tileId: string, callerTenantId: string): PagedContextTile | undefined {
    const key = `${callerTenantId}:${tileId}`;
    const tile = this.tiles.get(key);

    if (tile) {
      this.hitCount++;
      const updatedTile: PagedContextTile = Object.freeze({
        ...tile,
        lastAccessedAt: Date.now(),
        accessCount: tile.accessCount + 1,
      });
      this.tiles.set(key, updatedTile);
      return updatedTile;
    }

    // Intercept cross-tenant unauthorized access attempts fail-closed
    for (const otherTile of this.tiles.values()) {
      if (otherTile.tileId === tileId && otherTile.tenantId !== callerTenantId) {
        throw new OptimizationTenantViolationError(callerTenantId, otherTile.tenantId);
      }
    }

    this.missCount++;
    return undefined;
  }

  public hasTile(tileId: string, callerTenantId: string): boolean {
    const key = `${callerTenantId}:${tileId}`;
    return this.tiles.has(key);
  }

  /**
   * Evict the least-recently and least-frequently accessed tile.
   */
  private evictLeastValuableTile(): void {
    let candidateKey: string | null = null;
    let lowestScore = Infinity;

    // Score = accessCount * 1e9 + lastAccessedAt (lower score is evicted first)
    for (const [key, tile] of this.tiles.entries()) {
      const score = tile.accessCount * 1_000_000 + (tile.lastAccessedAt % 1_000_000);
      if (score < lowestScore) {
        lowestScore = score;
        candidateKey = key;
      }
    }

    if (candidateKey) {
      const evicted = this.tiles.get(candidateKey);
      if (evicted) {
        this.currentHeapBytes -= evicted.byteSize;
        this.tiles.delete(candidateKey);
        this.evictionCount++;
      }
    }
  }

  /**
   * Get memory and cache metrics.
   */
  public getStats(tenantId: string): {
    tileCount: number;
    heapBytes: number;
    hitCount: number;
    missCount: number;
    evictionCount: number;
    cacheHitRatio: number;
  } {
    let tenantTiles = 0;
    let tenantBytes = 0;

    for (const [key, tile] of this.tiles.entries()) {
      if (tile.tenantId === tenantId) {
        tenantTiles++;
        tenantBytes += tile.byteSize;
      }
    }

    const totalRequests = this.hitCount + this.missCount;
    const cacheHitRatio = totalRequests > 0 ? Number((this.hitCount / totalRequests).toFixed(4)) : 0.0;

    return {
      tileCount: tenantTiles,
      heapBytes: tenantBytes,
      hitCount: this.hitCount,
      missCount: this.missCount,
      evictionCount: this.evictionCount,
      cacheHitRatio,
    };
  }

  public clear(): void {
    this.tiles.clear();
    this.currentHeapBytes = 0;
    this.hitCount = 0;
    this.missCount = 0;
    this.evictionCount = 0;
  }
}
