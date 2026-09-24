/**
 * CUBiO AI — Phase 6: Task 90 — Native Language Intelligence Optimization
 * src/cubio/language/native/optimization/boundedLanguageCache.ts
 *
 * Thread-safe, bounded, multi-tenant LRU / FIFO / Time-aware cache for
 * native language operations. Eliminates unbounded memory growth while
 * accelerating repeated token, needle, concept, and epistemic queries.
 */

import {
  BoundedLanguageCacheConfig,
  BoundedLanguageCacheStats,
  LanguageCacheBudgetExceededError,
  LanguageEvictionPolicy,
} from './languageOptimizationTypes';

interface CacheEntry<V> {
  readonly key: string;
  readonly tenantId: string;
  readonly value: V;
  readonly sizeBytes: number;
  readonly stateVersion: number;
  readonly createdAt: number;
  lastAccessedAt: number;
}

export class BoundedLanguageCache<V> {
  private readonly _maxCapacity: number;
  private readonly _maxBytesBudget: number;
  private readonly _evictionPolicy: LanguageEvictionPolicy;
  private readonly _ttlMs: number;

  private readonly _entries: Map<string, CacheEntry<V>> = new Map();
  private readonly _tenantCounts: Map<string, number> = new Map();

  private _hits = 0;
  private _misses = 0;
  private _evictionCount = 0;
  private _approximateBytes = 0;

  constructor(config: Partial<BoundedLanguageCacheConfig> = {}) {
    this._maxCapacity = Math.max(1, config.maxCapacity ?? 512);
    this._maxBytesBudget = config.maxBytesBudget ?? Number.MAX_SAFE_INTEGER;
    this._evictionPolicy = config.evictionPolicy ?? 'LRU';
    this._ttlMs = config.ttlMs ?? 0;
  }

  public get maxCapacity(): number {
    return this._maxCapacity;
  }

  public get size(): number {
    return this._entries.size;
  }

  public get approximateBytes(): number {
    return this._approximateBytes;
  }

  public get hits(): number {
    return this._hits;
  }

  public get misses(): number {
    return this._misses;
  }

  public get hitRatio(): number {
    const total = this._hits + this._misses;
    return total === 0 ? 0 : Number((this._hits / total).toFixed(4));
  }

  public get evictionCount(): number {
    return this._evictionCount;
  }

  /**
   * Generates a composite key ensuring strict multi-tenant isolation.
   */
  private _compositeKey(tenantId: string, rawKey: string): string {
    return `${tenantId}:${rawKey}`;
  }

  /**
   * Approximates the byte size of an item for memory budgeting.
   */
  private _estimateSizeBytes(value: V): number {
    if (value === null || value === undefined) return 8;
    if (typeof value === 'string') return value.length * 2 + 16;
    if (typeof value === 'number') return 8;
    if (typeof value === 'boolean') return 4;
    if (Buffer.isBuffer(value)) return value.length;
    try {
      return JSON.stringify(value).length * 2 + 32;
    } catch {
      return 128;
    }
  }

  /**
   * Retrieves a cached value, checking TTL, tenant ownership, and OCC version.
   */
  public get(tenantId: string, rawKey: string, expectedVersion?: number): V | undefined {
    const key = this._compositeKey(tenantId, rawKey);
    const entry = this._entries.get(key);

    if (!entry) {
      this._misses++;
      return undefined;
    }

    // TTL check
    const now = Date.now();
    if (this._ttlMs > 0 && now - entry.createdAt > this._ttlMs) {
      this._deleteEntry(key, entry);
      this._misses++;
      return undefined;
    }

    // OCC version check
    if (expectedVersion !== undefined && entry.stateVersion !== expectedVersion) {
      this._deleteEntry(key, entry);
      this._misses++;
      return undefined;
    }

    // Update access metadata
    entry.lastAccessedAt = now;

    // In LRU, re-insert to update Map iteration order (newest at end)
    if (this._evictionPolicy === 'LRU') {
      this._entries.delete(key);
      this._entries.set(key, entry);
    }

    this._hits++;
    return entry.value;
  }

  /**
   * Stores a value in the cache, evicting if capacity or budget is exceeded.
   */
  public set(
    tenantId: string,
    rawKey: string,
    value: V,
    stateVersion: number = 1
  ): void {
    const key = this._compositeKey(tenantId, rawKey);
    const existing = this._entries.get(key);
    const itemSizeBytes = this._estimateSizeBytes(value);

    // If setting exceeds total budget alone, fail closed
    if (itemSizeBytes > this._maxBytesBudget) {
      throw new LanguageCacheBudgetExceededError(
        `Item size (${itemSizeBytes} bytes) exceeds maximum cache budget (${this._maxBytesBudget} bytes)`
      );
    }

    if (existing) {
      this._deleteEntry(key, existing);
    }

    // Evict until within capacity and budget limits
    while (
      this._entries.size >= this._maxCapacity ||
      this._approximateBytes + itemSizeBytes > this._maxBytesBudget
    ) {
      if (!this._evictOne()) {
        throw new LanguageCacheBudgetExceededError(
          `Unable to satisfy cache budget constraints even after eviction.`
        );
      }
    }

    const now = Date.now();
    const entry: CacheEntry<V> = {
      key,
      tenantId,
      value,
      sizeBytes: itemSizeBytes,
      stateVersion,
      createdAt: now,
      lastAccessedAt: now,
    };

    this._entries.set(key, entry);
    this._approximateBytes += itemSizeBytes;

    const tCount = this._tenantCounts.get(tenantId) ?? 0;
    this._tenantCounts.set(tenantId, tCount + 1);
  }

  /**
   * Checks whether a non-expired entry exists for the given tenant and key.
   */
  public has(tenantId: string, rawKey: string, expectedVersion?: number): boolean {
    const key = this._compositeKey(tenantId, rawKey);
    const entry = this._entries.get(key);
    if (!entry) return false;

    if (this._ttlMs > 0 && Date.now() - entry.createdAt > this._ttlMs) {
      this._deleteEntry(key, entry);
      return false;
    }

    if (expectedVersion !== undefined && entry.stateVersion !== expectedVersion) {
      this._deleteEntry(key, entry);
      return false;
    }

    return true;
  }

  /**
   * Deletes a specific entry by tenant and key.
   */
  public delete(tenantId: string, rawKey: string): boolean {
    const key = this._compositeKey(tenantId, rawKey);
    const entry = this._entries.get(key);
    if (!entry) return false;
    this._deleteEntry(key, entry);
    return true;
  }

  /**
   * Clears all entries for a specific tenant or all entries if tenant is omitted.
   */
  public clear(tenantId?: string): void {
    if (!tenantId) {
      this._entries.clear();
      this._tenantCounts.clear();
      this._approximateBytes = 0;
      return;
    }

    const entries = Array.from(this._entries.entries());
    for (let i = 0; i < entries.length; i++) {
      const [k, entry] = entries[i];
      if (entry.tenantId === tenantId) {
        this._deleteEntry(k, entry);
      }
    }
  }

  /**
   * Evicts a single entry based on active eviction policy.
   */
  private _evictOne(): boolean {
    if (this._entries.size === 0) return false;

    let candidateKey: string | null = null;

    if (this._evictionPolicy === 'FIFO') {
      const iter = this._entries.keys();
      const first = iter.next();
      candidateKey = first.value ?? null;
    } else if (this._evictionPolicy === 'LRU') {
      const iter = this._entries.keys();
      const first = iter.next();
      candidateKey = first.value ?? null;
    } else if (this._evictionPolicy === 'TIME_AWARE_LRU') {
      let minScore = Number.MAX_SAFE_INTEGER;
      const entries = Array.from(this._entries.entries());
      for (let i = 0; i < entries.length; i++) {
        const [k, entry] = entries[i];
        const score = entry.lastAccessedAt + (this._ttlMs > 0 ? entry.createdAt : 0);
        if (score < minScore) {
          minScore = score;
          candidateKey = k;
        }
      }
    }

    if (!candidateKey) {
      const iter = this._entries.keys();
      const first = iter.next();
      candidateKey = first.value ?? null;
    }

    if (candidateKey) {
      const entry = this._entries.get(candidateKey);
      if (entry) {
        this._deleteEntry(candidateKey, entry);
        this._evictionCount++;
        return true;
      }
    }

    return false;
  }

  private _deleteEntry(key: string, entry: CacheEntry<V>): void {
    this._entries.delete(key);
    this._approximateBytes = Math.max(0, this._approximateBytes - entry.sizeBytes);

    const tCount = this._tenantCounts.get(entry.tenantId);
    if (tCount !== undefined) {
      if (tCount <= 1) {
        this._tenantCounts.delete(entry.tenantId);
      } else {
        this._tenantCounts.set(entry.tenantId, tCount - 1);
      }
    }
  }

  /**
   * Returns complete telemetry stats.
   */
  public getStats(): BoundedLanguageCacheStats {
    const tenantCounts: Record<string, number> = {};
    const tEntries = Array.from(this._tenantCounts.entries());
    for (let i = 0; i < tEntries.length; i++) {
      const [tid, count] = tEntries[i];
      tenantCounts[tid] = count;
    }

    return Object.freeze({
      size: this._entries.size,
      maxCapacity: this._maxCapacity,
      approximateBytes: this._approximateBytes,
      maxBytesBudget: this._maxBytesBudget,
      hits: this._hits,
      misses: this._misses,
      hitRatio: this.hitRatio,
      evictionCount: this._evictionCount,
      tenantCounts: Object.freeze(tenantCounts),
    });
  }

  /**
   * Exports entries for checkpoint restoration.
   */
  public exportEntries(): Array<{ key: string; tenantId: string; value: V; stateVersion: number }> {
    const out: Array<{ key: string; tenantId: string; value: V; stateVersion: number }> = [];
    const values = Array.from(this._entries.values());
    for (let i = 0; i < values.length; i++) {
      const entry = values[i];
      out.push({
        key: entry.key,
        tenantId: entry.tenantId,
        value: entry.value,
        stateVersion: entry.stateVersion,
      });
    }
    return out;
  }

  /**
   * Imports entries from a checkpoint.
   */
  public importEntries(entries: Array<{ key: string; tenantId: string; value: V; stateVersion: number }>): void {
    this.clear();
    for (let i = 0; i < entries.length; i++) {
      const item = entries[i];
      const rawKey = item.key.startsWith(`${item.tenantId}:`)
        ? item.key.slice(item.tenantId.length + 1)
        : item.key;
      this.set(item.tenantId, rawKey, item.value, item.stateVersion);
    }
  }
}
