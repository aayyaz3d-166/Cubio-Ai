/**
 * CUBiO AI — Task 181: Long-Context Efficiency & Resource Optimization
 * src/cubio/model/native_long_context_optimization/contextReusePool.ts
 *
 * Content-Addressed Context Reuse Pool:
 * Stores and reuses pre-tokenized sequences and verified parsed context
 * keyed by cryptographic SHA-256 hashes, eliminating redundant CPU parsing overhead.
 *
 * STRICT INVARIANTS:
 * 1. Cryptographic SHA-256 content addressing.
 * 2. Strict tenant isolation: cached sequences accessible only by owning tenant.
 * 3. Bounded capacity to prevent memory bloat.
 */

import { createHash } from 'node:crypto';
import { OptimizationTenantViolationError } from './types.js';

export interface CachedContextSequence {
  readonly contentHash: string;
  readonly tenantId: string;
  readonly tokens: readonly string[];
  readonly tokenCount: number;
  readonly byteSize: number;
  readonly lastAccessedAt: number;
  readonly accessCount: number;
}

export class ContextReusePool {
  private readonly pool = new Map<string, CachedContextSequence>(); // key = `${tenantId}:${contentHash}`
  private readonly maxEntries: number;

  private hits = 0;
  private misses = 0;

  constructor(maxEntries: number = 256) {
    this.maxEntries = maxEntries;
  }

  /**
   * Register a verified token sequence into the content-addressed reuse pool.
   */
  public registerSequence(content: string, tenantId: string, tokens: readonly string[]): string {
    const contentHash = createHash('sha256').update(content).digest('hex');
    const key = `${tenantId}:${contentHash}`;

    // Evict least valuable if capacity reached
    if (this.pool.size >= this.maxEntries && !this.pool.has(key)) {
      this.evictOne();
    }

    const byteSize = content.length * 2 + tokens.length * 8;
    const entry: CachedContextSequence = Object.freeze({
      contentHash,
      tenantId,
      tokens: Object.freeze([...tokens]),
      tokenCount: tokens.length,
      byteSize,
      lastAccessedAt: Date.now(),
      accessCount: 1,
    });

    this.pool.set(key, entry);
    return contentHash;
  }

  /**
   * Look up a cached token sequence by content hash with tenant isolation.
   */
  public getSequence(contentHash: string, callerTenantId: string): readonly string[] | undefined {
    const key = `${callerTenantId}:${contentHash}`;
    const entry = this.pool.get(key);

    if (!entry) {
      this.misses++;
      return undefined;
    }

    if (entry.tenantId !== callerTenantId) {
      throw new OptimizationTenantViolationError(callerTenantId, entry.tenantId);
    }

    this.hits++;
    const updated: CachedContextSequence = Object.freeze({
      ...entry,
      lastAccessedAt: Date.now(),
      accessCount: entry.accessCount + 1,
    });
    this.pool.set(key, updated);

    return updated.tokens;
  }

  public hasSequence(contentHash: string, callerTenantId: string): boolean {
    const key = `${callerTenantId}:${contentHash}`;
    return this.pool.has(key);
  }

  private evictOne(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.pool.entries()) {
      if (entry.lastAccessedAt < oldestTime) {
        oldestTime = entry.lastAccessedAt;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.pool.delete(oldestKey);
    }
  }

  public getStats(): { hits: number; misses: number; size: number; hitRatio: number } {
    const total = this.hits + this.misses;
    const hitRatio = total > 0 ? Number((this.hits / total).toFixed(4)) : 0.0;
    return {
      hits: this.hits,
      misses: this.misses,
      size: this.pool.size,
      hitRatio,
    };
  }

  public clear(): void {
    this.pool.clear();
    this.hits = 0;
    this.misses = 0;
  }
}
