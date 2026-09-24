/**
 * CUBiO AI — Task 165: Native Model Memory Integration
 * src/cubio/model/native_memory_integration/modelVdbStore.ts
 *
 * Authoritative Persistent Working Database (VDB) for Scaled Language Model.
 * Provides canonical persistence, OCC-validated state transitions, selective
 * on-demand retrieval, and bounded LRU working caches.
 */

import {
  IS_ACTUATION_BLOCKED,
  ModelMemoryRecord,
  CanonicalMemoryReference,
  ModelMemoryQuery,
  ModelMemoryMutation,
  ModelMemoryCacheStats,
  ModelMemoryTenantViolationError,
  ModelMemoryIntegrityError,
} from './types';
import { ModelMemoryGovernor } from './modelMemoryGovernor';

export class ModelVdbStore {
  // Authoritative persistent storage: key = `${tenantId}:${objectId}`
  private readonly persistentStore: Map<string, ModelMemoryRecord> = new Map();

  // Bounded LRU working cache: key = `${tenantId}:${objectId}`
  private readonly lruCache: Map<string, ModelMemoryRecord> = new Map();
  private readonly cacheCapacity: number;

  private cacheHits = 0;
  private cacheMisses = 0;
  private evictionCount = 0;

  constructor(cacheCapacity: number = 16) {
    this.cacheCapacity = cacheCapacity;
  }

  /**
   * Persists or updates a canonical memory record with OCC validation.
   */
  public saveRecord(
    mutation: ModelMemoryMutation,
    domain: string = 'general',
    metadata?: Record<string, unknown>
  ): ModelMemoryRecord {
    if (!IS_ACTUATION_BLOCKED) {
      throw new Error('Permanent actuation lock violated: IS_ACTUATION_BLOCKED must be true.');
    }

    // 1. Actuation Lockout
    ModelMemoryGovernor.assertActuationLockout(mutation.newContent);

    const storeKey = `${mutation.tenantId}:${mutation.objectId}`;
    const existing = this.persistentStore.get(storeKey) || null;

    // 2. OCC Concurrency Check
    ModelMemoryGovernor.validateOCC(existing, mutation);

    // 3. Epistemic Anti-Pollution Check
    const epistemicStatus = mutation.newEpistemicStatus ?? (existing ? existing.epistemicStatus : 'FACT');
    const isCanonical = mutation.promoteToCanonical ?? (existing ? existing.isCanonicalKnowledge : true);
    ModelMemoryGovernor.assertAntiPollution(epistemicStatus, isCanonical, mutation.objectId);

    // 4. Compute Version & Checksum
    const nextVersion = existing ? existing.reference.stateVersion + 1 : 1;
    const spatialCellId = mutation.newSpatialCellId ?? existing?.reference.spatialCellId;

    const checksum = ModelMemoryGovernor.computeChecksum(
      mutation.objectId,
      mutation.tenantId,
      domain,
      nextVersion,
      mutation.newContent,
      spatialCellId
    );

    const summary = mutation.newContent.length > 60
      ? `${mutation.newContent.substring(0, 57)}...`
      : mutation.newContent;

    const reference: CanonicalMemoryReference = {
      objectId: mutation.objectId,
      tenantId: mutation.tenantId,
      domain,
      stateVersion: nextVersion,
      checksum,
      spatialCellId,
      contentLength: mutation.newContent.length,
      summary,
      timestamp: new Date().toISOString(),
    };

    const record: ModelMemoryRecord = {
      reference,
      content: mutation.newContent,
      epistemicStatus,
      isCanonicalKnowledge: isCanonical,
      isActuationBlocked: IS_ACTUATION_BLOCKED,
      metadata: metadata ? Object.freeze({ ...metadata }) : undefined,
    };

    // 5. Authoritative Persistent Write
    this.persistentStore.set(storeKey, record);

    // 6. Update LRU Cache
    this.updateCache(storeKey, record);

    return record;
  }

  /**
   * Retrieves a full persistent record by objectId and callerTenantId.
   */
  public getRecord(objectId: string, callerTenantId: string): ModelMemoryRecord | null {
    const storeKey = `${callerTenantId}:${objectId}`;

    // 1. Check LRU Cache
    if (this.lruCache.has(storeKey)) {
      this.cacheHits++;
      const record = this.lruCache.get(storeKey)!;
      // Re-insert for LRU freshness
      this.lruCache.delete(storeKey);
      this.lruCache.set(storeKey, record);
      return record;
    }

    // 2. Query Authoritative Persistent VDB Store
    const persistentRecord = this.persistentStore.get(storeKey);
    if (!persistentRecord) {
      // Intercept cross-tenant intrusion attempt
      for (const [key, otherRecord] of this.persistentStore.entries()) {
        if (otherRecord.reference.objectId === objectId) {
          throw new ModelMemoryTenantViolationError(
            'Unauthorized attempt to read record across tenant boundary',
            callerTenantId,
            otherRecord.reference.tenantId
          );
        }
      }
      return null;
    }

    // 3. Cryptographic Verification
    const expectedChecksum = ModelMemoryGovernor.computeChecksum(
      persistentRecord.reference.objectId,
      persistentRecord.reference.tenantId,
      persistentRecord.reference.domain,
      persistentRecord.reference.stateVersion,
      persistentRecord.content,
      persistentRecord.reference.spatialCellId
    );

    if (persistentRecord.reference.checksum !== expectedChecksum) {
      throw new ModelMemoryIntegrityError(
        objectId,
        `Checksum corruption detected: expected ${expectedChecksum}, found ${persistentRecord.reference.checksum}`
      );
    }

    // 4. Cache Miss & Load On-Demand
    this.cacheMisses++;
    this.updateCache(storeKey, persistentRecord);

    return persistentRecord;
  }

  /**
   * Retrieves only the lightweight canonical reference without deserializing raw content.
   */
  public getReference(objectId: string, callerTenantId: string): CanonicalMemoryReference | null {
    const storeKey = `${callerTenantId}:${objectId}`;
    const record = this.persistentStore.get(storeKey);
    if (!record) return null;
    return record.reference;
  }

  /**
   * Selectively queries memory references matching criteria without loading full tables.
   */
  public queryReferences(query: ModelMemoryQuery): readonly CanonicalMemoryReference[] {
    const results: CanonicalMemoryReference[] = [];
    const limit = query.limit ?? 50;

    for (const record of this.persistentStore.values()) {
      // Strict Tenant Filter
      if (record.reference.tenantId !== query.tenantId) {
        continue;
      }

      // Domain Filter
      if (query.domain && record.reference.domain !== query.domain) {
        continue;
      }

      // Spatial HCP Cell Filter
      if (query.spatialCellId !== undefined && record.reference.spatialCellId !== query.spatialCellId) {
        continue;
      }

      // Canonical Filter
      if (query.onlyCanonical && !record.isCanonicalKnowledge) {
        continue;
      }

      // Keyword Filter
      if (query.keywords && query.keywords.length > 0) {
        const lower = record.content.toLowerCase();
        const matches = query.keywords.some((kw) => lower.includes(kw.toLowerCase()));
        if (!matches) continue;
      }

      results.push(record.reference);
      if (results.length >= limit) break;
    }

    return Object.freeze(results);
  }

  /**
   * Updates LRU cache with eviction logic.
   */
  private updateCache(key: string, record: ModelMemoryRecord): void {
    if (this.lruCache.has(key)) {
      this.lruCache.delete(key);
    } else if (this.lruCache.size >= this.cacheCapacity) {
      // Evict least recently used (first item in Map)
      const oldestKey = this.lruCache.keys().next().value;
      if (oldestKey) {
        this.lruCache.delete(oldestKey);
        this.evictionCount++;
      }
    }
    this.lruCache.set(key, record);
  }

  /**
   * Cache telemetry.
   */
  public getCacheStats(): ModelMemoryCacheStats {
    return Object.freeze({
      cacheCapacity: this.cacheCapacity,
      currentSize: this.lruCache.size,
      cacheHits: this.cacheHits,
      cacheMisses: this.cacheMisses,
      evictionCount: this.evictionCount,
    });
  }

  /**
   * Clear working cache (persistent store remains untouched).
   */
  public clearCache(): void {
    this.lruCache.clear();
  }

  /**
   * Total persistent record count.
   */
  public getPersistentRecordCount(): number {
    return this.persistentStore.size;
  }

  /**
   * Dumps entire state for checkpoint transport export.
   */
  public getAllRecordsForTenant(tenantId: string): readonly ModelMemoryRecord[] {
    const list: ModelMemoryRecord[] = [];
    for (const record of this.persistentStore.values()) {
      if (record.reference.tenantId === tenantId) {
        list.push(record);
      }
    }
    return list;
  }

  /**
   * Directly restores an authoritative record from verified backup checkpoint.
   */
  public restoreRecordDirect(record: ModelMemoryRecord): void {
    const storeKey = `${record.reference.tenantId}:${record.reference.objectId}`;
    this.persistentStore.set(storeKey, record);
    this.updateCache(storeKey, record);
  }
}

