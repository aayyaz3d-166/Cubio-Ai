/**
 * CUBiO AI — Task 190: Native Long-Term Knowledge Memory
 * src/cubio/model/native_long_term_knowledge_memory/tierCache.ts
 *
 * Multi-Tier In-Memory Cache (L1, L2, L3):
 * Enforces tier capacity bounds, tracks logical access ticks, and
 * triggers deterministic epistemic-aware eviction.
 */

import {
  KnowledgeMemoryReference,
  L1MaterializedPayload,
  TierCapacityConfig,
  KnowledgeTierStats,
  KnowledgeTierCapacityError,
  KnowledgeMemoryTenantViolationError,
} from './types';
import { EvictionPolicy } from './evictionPolicy';

export class TierCache {
  public static readonly DEFAULT_L1_CAPACITY = 16;
  public static readonly DEFAULT_L2_CAPACITY = 64;
  public static readonly DEFAULT_L3_CAPACITY = 128;

  public static readonly MAX_L1_CAPACITY = 64;
  public static readonly MAX_L2_CAPACITY = 256;
  public static readonly MAX_L3_CAPACITY = 512;

  private readonly l1Capacity: number;
  private readonly l2Capacity: number;
  private readonly l3Capacity: number;

  // Key: `${tenantId}:${objectId}`
  private readonly l1Payloads: Map<string, L1MaterializedPayload> = new Map();
  private readonly l2References: Map<string, KnowledgeMemoryReference> = new Map();
  private readonly l3References: Map<string, KnowledgeMemoryReference> = new Map();

  // Logical deterministic tick counter
  private logicalTick: number = 0;

  // Metrics
  private cacheHits: number = 0;
  private cacheMisses: number = 0;
  private totalEvictions: number = 0;

  constructor(config?: TierCapacityConfig) {
    this.l1Capacity = Math.min(config?.l1Capacity ?? TierCache.DEFAULT_L1_CAPACITY, TierCache.MAX_L1_CAPACITY);
    this.l2Capacity = Math.min(config?.l2Capacity ?? TierCache.DEFAULT_L2_CAPACITY, TierCache.MAX_L2_CAPACITY);
    this.l3Capacity = Math.min(config?.l3Capacity ?? TierCache.DEFAULT_L3_CAPACITY, TierCache.MAX_L3_CAPACITY);
  }

  private makeKey(tenantId: string, id: string): string {
    return `${tenantId}:${id}`;
  }

  public nextTick(): number {
    return ++this.logicalTick;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // L1 Materialized Payload Cache
  // ───────────────────────────────────────────────────────────────────────────

  public putL1(payload: L1MaterializedPayload, refMap: Map<string, KnowledgeMemoryReference>): void {
    const key = this.makeKey(payload.tenantId, payload.objectId);

    // If already exists, overwrite without eviction
    if (this.l1Payloads.has(key)) {
      this.l1Payloads.set(key, Object.freeze({ ...payload }));
      return;
    }

    // Evict if at capacity
    if (this.l1Payloads.size >= this.l1Capacity) {
      const victim = EvictionPolicy.selectL1Victim(Array.from(this.l1Payloads.values()), refMap);
      const victimKey = this.makeKey(victim.tenantId, victim.objectId);
      this.l1Payloads.delete(victimKey);
      this.totalEvictions++;
    }

    this.l1Payloads.set(key, Object.freeze({ ...payload }));
  }

  public getL1(objectId: string, callerTenantId: string): L1MaterializedPayload | null {
    const key = this.makeKey(callerTenantId, objectId);
    const item = this.l1Payloads.get(key);
    if (!item) {
      this.cacheMisses++;
      return null;
    }
    if (item.tenantId !== callerTenantId) {
      throw new KnowledgeMemoryTenantViolationError(callerTenantId, item.tenantId);
    }
    this.cacheHits++;
    return item;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // L2 Session Reference Cache
  // ───────────────────────────────────────────────────────────────────────────

  public putL2(ref: KnowledgeMemoryReference): KnowledgeMemoryReference {
    const key = this.makeKey(ref.tenantId, ref.objectId);

    if (this.l2References.has(key)) {
      const updated = this.touchReference(this.l2References.get(key)!);
      this.l2References.set(key, updated);
      return updated;
    }

    // Evict if at capacity
    if (this.l2References.size >= this.l2Capacity) {
      const victim = EvictionPolicy.selectEvictionVictim(Array.from(this.l2References.values()));
      const victimKey = this.makeKey(victim.tenantId, victim.objectId);
      this.l2References.delete(victimKey);
      this.totalEvictions++;
    }

    const newRef = Object.freeze({ ...ref, lastAccessTick: this.nextTick() });
    this.l2References.set(key, newRef);
    return newRef;
  }

  public getL2(objectId: string, callerTenantId: string): KnowledgeMemoryReference | null {
    const key = this.makeKey(callerTenantId, objectId);
    const item = this.l2References.get(key);
    if (!item) {
      return null;
    }
    if (item.tenantId !== callerTenantId) {
      throw new KnowledgeMemoryTenantViolationError(callerTenantId, item.tenantId);
    }
    const touched = this.touchReference(item);
    this.l2References.set(key, touched);
    return touched;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // L3 Long-Term Reference Cache
  // ───────────────────────────────────────────────────────────────────────────

  public putL3(ref: KnowledgeMemoryReference): KnowledgeMemoryReference {
    const key = this.makeKey(ref.tenantId, ref.objectId);

    if (this.l3References.has(key)) {
      const updated = this.touchReference(this.l3References.get(key)!);
      this.l3References.set(key, updated);
      return updated;
    }

    // Evict if at capacity
    if (this.l3References.size >= this.l3Capacity) {
      const victim = EvictionPolicy.selectEvictionVictim(Array.from(this.l3References.values()));
      const victimKey = this.makeKey(victim.tenantId, victim.objectId);
      this.l3References.delete(victimKey);
      this.totalEvictions++;
    }

    const newRef = Object.freeze({ ...ref, tier: 'L3_LONG_TERM' as const, lastAccessTick: this.nextTick() });
    this.l3References.set(key, newRef);
    return newRef;
  }

  public getL3(objectId: string, callerTenantId: string): KnowledgeMemoryReference | null {
    const key = this.makeKey(callerTenantId, objectId);
    const item = this.l3References.get(key);
    if (!item) {
      return null;
    }
    if (item.tenantId !== callerTenantId) {
      throw new KnowledgeMemoryTenantViolationError(callerTenantId, item.tenantId);
    }
    const touched = this.touchReference(item);
    this.l3References.set(key, touched);
    return touched;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Helpers & Stats
  // ───────────────────────────────────────────────────────────────────────────

  public touchReference(ref: KnowledgeMemoryReference): KnowledgeMemoryReference {
    return Object.freeze({
      ...ref,
      accessCount: ref.accessCount + 1,
      lastAccessTick: this.nextTick(),
    });
  }

  public getReference(objectId: string, callerTenantId: string): KnowledgeMemoryReference | null {
    return this.getL2(objectId, callerTenantId) ?? this.getL3(objectId, callerTenantId);
  }

  public getAllL2(callerTenantId: string): readonly KnowledgeMemoryReference[] {
    const res: KnowledgeMemoryReference[] = [];
    for (const r of this.l2References.values()) if (r.tenantId === callerTenantId) res.push(r);
    return Object.freeze(res);
  }

  public getAllL3(callerTenantId: string): readonly KnowledgeMemoryReference[] {
    const res: KnowledgeMemoryReference[] = [];
    for (const r of this.l3References.values()) if (r.tenantId === callerTenantId) res.push(r);
    return Object.freeze(res);
  }

  public getStats(tenantId: string, l4VdbCount: number = 0): KnowledgeTierStats {
    let l1Count = 0;
    let l2Count = 0;
    let l3Count = 0;

    for (const p of this.l1Payloads.values()) if (p.tenantId === tenantId) l1Count++;
    for (const r of this.l2References.values()) if (r.tenantId === tenantId) l2Count++;
    for (const r of this.l3References.values()) if (r.tenantId === tenantId) l3Count++;

    return Object.freeze({
      tenantId,
      l1Count,
      l2Count,
      l3Count,
      l4VdbCount,
      totalCacheHits: this.cacheHits,
      totalCacheMisses: this.cacheMisses,
      totalEvictions: this.totalEvictions,
    });
  }
}
