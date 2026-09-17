/**
 * CUBiO AI — Task 23: Memory Address / Index Layer
 * Phase 2 — Native Memory
 * src/cubio/memory/native/memoryIndex.ts
 *
 * Lightweight, native, deterministic memory address and index engine.
 *
 * GUARANTEES:
 * 1. Indexes reference pointers (MemoryIndexReference), NOT full payloads.
 * 2. Multi-axis indexing: storageKey, objectId, tenantId, domain, cellId, address369.
 * 3. Spatial authority strictly delegated to src/core/address369.ts.
 * 4. Sparse on-demand storage: 0 pre-allocation of spatial or state spaces.
 * 5. Deterministic insertion, lookup, removal, and rebuild.
 * 6. Stale version rejection and fail-closed validation.
 */

import {
  cellIdToAddress369,
  address369ToCellId,
  validateCellId,
  validateAddress,
  isSpatialAddress,
  SPATIAL_ADDRESS_OFFSET,
  SPATIAL_ADDRESS_END,
} from '../../../core/address369';

import { DEFAULT_TENANT_ID, CanonicalDomain } from '../../core/canonicalIdentity';
import { computeMathChecksum } from '../../math/checksum';
import { NativeSparseMemoryStore } from './sparseMemoryStore';
import { NativeMemoryRecord } from './types';
import {
  MemoryIndexReference,
  IndexRebuildReport,
  IndexQueryFilter,
  IndexStats,
} from './indexTypes';

import {
  NativeMemoryValidationError,
  assertValidObjectId,
  assertValidTenantId,
} from './validation';

export type {
  MemoryIndexReference,
  IndexRebuildReport,
  IndexQueryFilter,
  IndexStats,
};

/**
 * Creates a MemoryIndexReference pointer from an active NativeMemoryRecord.
 */
export function recordToIndexReference(record: NativeMemoryRecord): MemoryIndexReference {
  const cellId = record.identity.cellId;
  const address369 = cellId !== undefined ? cellIdToAddress369(cellId) : undefined;

  return Object.freeze({
    storageKey: record.storageKey,
    objectId: record.identity.objectId,
    tenantId: record.identity.tenantId,
    domain: record.identity.domain,
    stateVersion: record.identity.stateVersion,
    checksum: record.identity.checksum,
    ...(cellId !== undefined ? { cellId } : {}),
    ...(address369 !== undefined ? { address369 } : {}),
    sizeBytes: record.metadata.sizeBytes,
    updatedAt: record.metadata.updatedAt,
  });
}

/**
 * Sovereign native memory index engine.
 */
export class NativeMemoryIndex {
  /** Primary index: storageKey (`${tenantId}:${objectId}`) -> MemoryIndexReference */
  private readonly byStorageKey: Map<string, MemoryIndexReference> = new Map();

  /** Secondary index: tenantId -> Set of storageKeys */
  private readonly byTenant: Map<string, Set<string>> = new Map();

  /** Secondary index: objectId -> Set of storageKeys (allows multi-tenant discovery) */
  private readonly byObjectId: Map<string, Set<string>> = new Map();

  /** Secondary index: canonical domain -> Set of storageKeys */
  private readonly byDomain: Map<CanonicalDomain, Set<string>> = new Map();

  /** Sparse spatial index: cellId [0..342] -> Set of storageKeys */
  private readonly byCellId: Map<number, Set<string>> = new Map();

  /** Sparse spatial index: address369 [26..368] -> Set of storageKeys */
  private readonly byAddress369: Map<number, Set<string>> = new Map();

  /**
   * Helper to format storageKey.
   */
  public static toStorageKey(tenantId: string, objectId: string): string {
    return `${tenantId.trim()}:${objectId.trim()}`;
  }

  /**
   * Inserts or updates an index reference pointer.
   * Enforces that updates strictly advance stateVersion.
   */
  public insert(ref: MemoryIndexReference): void {
    if (!ref || typeof ref !== 'object') {
      throw new NativeMemoryValidationError('Index entry must be an object');
    }

    assertValidObjectId(ref.objectId);
    assertValidTenantId(ref.tenantId);

    if (!Number.isInteger(ref.stateVersion) || ref.stateVersion < 1) {
      throw new NativeMemoryValidationError(
        `stateVersion must be a positive integer >= 1. Received: ${ref.stateVersion}`
      );
    }

    if (!ref.checksum || typeof ref.checksum !== 'string' || ref.checksum.length !== 64) {
      throw new NativeMemoryValidationError('checksum must be a 64-character hex string');
    }

    // Spatial validation
    let resolvedAddress369: number | undefined = undefined;
    if (ref.cellId !== undefined) {
      validateCellId(ref.cellId);
      resolvedAddress369 = cellIdToAddress369(ref.cellId);

      if (ref.address369 !== undefined && ref.address369 !== resolvedAddress369) {
        throw new NativeMemoryValidationError(
          `Spatial address mismatch: derived address369 is ${resolvedAddress369}, but entry specified ${ref.address369}`
        );
      }
    } else if (ref.address369 !== undefined) {
      throw new NativeMemoryValidationError(
        `Cannot specify address369 (${ref.address369}) without corresponding cellId`
      );
    }

    const storageKey = ref.storageKey || NativeMemoryIndex.toStorageKey(ref.tenantId, ref.objectId);
    const existing = this.byStorageKey.get(storageKey);

    // Stale version guard: revision must strictly increase
    if (existing && ref.stateVersion <= existing.stateVersion) {
      throw new NativeMemoryValidationError(
        `Stale index entry rejected: current stateVersion is ${existing.stateVersion}, received ${ref.stateVersion}`
      );
    }

    // Evict old secondary mappings if replacing
    if (existing) {
      this.evictSecondaryMappings(existing);
    }

    const frozenRef: MemoryIndexReference = Object.freeze({
      storageKey,
      objectId: ref.objectId.trim(),
      tenantId: ref.tenantId.trim(),
      domain: ref.domain,
      stateVersion: ref.stateVersion,
      checksum: ref.checksum,
      ...(ref.cellId !== undefined ? { cellId: ref.cellId } : {}),
      ...(resolvedAddress369 !== undefined ? { address369: resolvedAddress369 } : {}),
      sizeBytes: ref.sizeBytes || 0,
      updatedAt: ref.updatedAt || 0,
    });

    // Populate primary index
    this.byStorageKey.set(storageKey, frozenRef);

    // Populate tenant index
    let tenantSet = this.byTenant.get(frozenRef.tenantId);
    if (!tenantSet) {
      tenantSet = new Set();
      this.byTenant.set(frozenRef.tenantId, tenantSet);
    }
    tenantSet.add(storageKey);

    // Populate objectId index
    let objSet = this.byObjectId.get(frozenRef.objectId);
    if (!objSet) {
      objSet = new Set();
      this.byObjectId.set(frozenRef.objectId, objSet);
    }
    objSet.add(storageKey);

    // Populate domain index
    let domSet = this.byDomain.get(frozenRef.domain);
    if (!domSet) {
      domSet = new Set();
      this.byDomain.set(frozenRef.domain, domSet);
    }
    domSet.add(storageKey);

    // Populate spatial indexes
    if (frozenRef.cellId !== undefined && frozenRef.address369 !== undefined) {
      let cellSet = this.byCellId.get(frozenRef.cellId);
      if (!cellSet) {
        cellSet = new Set();
        this.byCellId.set(frozenRef.cellId, cellSet);
      }
      cellSet.add(storageKey);

      let addrSet = this.byAddress369.get(frozenRef.address369);
      if (!addrSet) {
        addrSet = new Set();
        this.byAddress369.set(frozenRef.address369, addrSet);
      }
      addrSet.add(storageKey);
    }
  }

  /**
   * Removes an indexed reference pointer and cleanly evicts all secondary keys.
   */
  public remove(objectId: string, tenantId = DEFAULT_TENANT_ID): boolean {
    assertValidObjectId(objectId);
    assertValidTenantId(tenantId);

    const storageKey = NativeMemoryIndex.toStorageKey(tenantId, objectId);
    const existing = this.byStorageKey.get(storageKey);

    if (!existing) {
      return false;
    }

    this.byStorageKey.delete(storageKey);
    this.evictSecondaryMappings(existing);
    return true;
  }

  /**
   * Evicts a reference from secondary index sets.
   */
  private evictSecondaryMappings(ref: MemoryIndexReference): void {
    const key = ref.storageKey;

    const tenantSet = this.byTenant.get(ref.tenantId);
    if (tenantSet) {
      tenantSet.delete(key);
      if (tenantSet.size === 0) this.byTenant.delete(ref.tenantId);
    }

    const objSet = this.byObjectId.get(ref.objectId);
    if (objSet) {
      objSet.delete(key);
      if (objSet.size === 0) this.byObjectId.delete(ref.objectId);
    }

    const domSet = this.byDomain.get(ref.domain);
    if (domSet) {
      domSet.delete(key);
      if (domSet.size === 0) this.byDomain.delete(ref.domain);
    }

    if (ref.cellId !== undefined) {
      const cellSet = this.byCellId.get(ref.cellId);
      if (cellSet) {
        cellSet.delete(key);
        if (cellSet.size === 0) this.byCellId.delete(ref.cellId);
      }
    }

    if (ref.address369 !== undefined) {
      const addrSet = this.byAddress369.get(ref.address369);
      if (addrSet) {
        addrSet.delete(key);
        if (addrSet.size === 0) this.byAddress369.delete(ref.address369);
      }
    }
  }

  /**
   * Looks up a memory reference pointer by universal objectId and tenantId.
   */
  public lookupByObjectId(objectId: string, tenantId = DEFAULT_TENANT_ID): MemoryIndexReference | null {
    assertValidObjectId(objectId);
    assertValidTenantId(tenantId);

    const storageKey = NativeMemoryIndex.toStorageKey(tenantId, objectId);
    return this.byStorageKey.get(storageKey) ?? null;
  }

  /**
   * Discovers all references sharing an objectId across all tenants.
   */
  public lookupAllTenantsByObjectId(objectId: string): readonly MemoryIndexReference[] {
    assertValidObjectId(objectId);
    const keys = this.byObjectId.get(objectId.trim());
    if (!keys || keys.size === 0) return Object.freeze([]);

    const results: MemoryIndexReference[] = [];
    const keyList = Array.from(keys);
    for (let i = 0; i < keyList.length; i++) {
      const ref = this.byStorageKey.get(keyList[i]);
      if (ref) results.push(ref);
    }
    results.sort((a, b) => a.storageKey.localeCompare(b.storageKey));
    return Object.freeze(results);
  }

  /**
   * Looks up all memory references mapped to a spatial cell [0..342].
   */
  public lookupByCellId(cellId: number, tenantId?: string): readonly MemoryIndexReference[] {
    validateCellId(cellId);
    const keys = this.byCellId.get(cellId);
    if (!keys || keys.size === 0) return Object.freeze([]);

    const results: MemoryIndexReference[] = [];
    const keyList = Array.from(keys);
    for (let i = 0; i < keyList.length; i++) {
      const ref = this.byStorageKey.get(keyList[i]);
      if (ref && (!tenantId || ref.tenantId === tenantId.trim())) {
        results.push(ref);
      }
    }
    results.sort((a, b) => a.storageKey.localeCompare(b.storageKey));
    return Object.freeze(results);
  }

  /**
   * Looks up all memory references mapped to a spatial address [26..368].
   * Delegates strictly to address369ToCellId via canonical spatial authority.
   */
  public lookupByAddress369(address369: number, tenantId?: string): readonly MemoryIndexReference[] {
    validateAddress(address369);
    if (!isSpatialAddress(address369)) {
      throw new NativeMemoryValidationError(
        `Address ${address369} is symbolic [0..25] and does not index spatial memory`
      );
    }
    const cellId = address369ToCellId(address369);
    return this.lookupByCellId(cellId, tenantId);
  }

  /**
   * Looks up all memory references in an architectural domain.
   */
  public lookupByDomain(domain: CanonicalDomain, tenantId?: string): readonly MemoryIndexReference[] {
    const keys = this.byDomain.get(domain);
    if (!keys || keys.size === 0) return Object.freeze([]);

    const results: MemoryIndexReference[] = [];
    const keyList = Array.from(keys);
    for (let i = 0; i < keyList.length; i++) {
      const ref = this.byStorageKey.get(keyList[i]);
      if (ref && (!tenantId || ref.tenantId === tenantId.trim())) {
        results.push(ref);
      }
    }
    results.sort((a, b) => a.storageKey.localeCompare(b.storageKey));
    return Object.freeze(results);
  }

  /**
   * Looks up all memory references belonging to a specific tenant.
   */
  public lookupByTenant(tenantId = DEFAULT_TENANT_ID): readonly MemoryIndexReference[] {
    assertValidTenantId(tenantId);
    const keys = this.byTenant.get(tenantId.trim());
    if (!keys || keys.size === 0) return Object.freeze([]);

    const results: MemoryIndexReference[] = [];
    const keyList = Array.from(keys);
    for (let i = 0; i < keyList.length; i++) {
      const ref = this.byStorageKey.get(keyList[i]);
      if (ref) results.push(ref);
    }
    results.sort((a, b) => a.storageKey.localeCompare(b.storageKey));
    return Object.freeze(results);
  }

  /**
   * Rebuilds the memory index completely from persistent storage.
   */
  public rebuildFromStore(store: NativeSparseMemoryStore): IndexRebuildReport {
    if (!store || !(store instanceof NativeSparseMemoryStore)) {
      throw new NativeMemoryValidationError('rebuildFromStore requires a valid NativeSparseMemoryStore instance');
    }

    const t0 = performance.now();
    this.clear();

    const domainCounts: Record<string, number> = {};
    const tenants = new Set<string>();
    let spatialCount = 0;

    // Retrieve all records from store
    const records = typeof store.getAllRecords === 'function'
      ? store.getAllRecords()
      : store.query({ limit: 100_000 });

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const indexRef = recordToIndexReference(record);
      this.insert(indexRef);

      tenants.add(record.identity.tenantId);
      domainCounts[record.identity.domain] = (domainCounts[record.identity.domain] || 0) + 1;
      if (record.identity.cellId !== undefined) {
        spatialCount++;
      }
    }

    const t1 = performance.now();
    const durationMs = Math.round((t1 - t0) * 100) / 100;
    const checksum = this.computeIndexChecksum();

    return Object.freeze({
      indexedCount: records.length,
      spatialEntriesCount: spatialCount,
      tenantCount: tenants.size,
      domainCounts: Object.freeze(domainCounts),
      durationMs,
      checksum,
    });
  }

  /**
   * Computes deterministic canonical SHA-256 digest of the entire index state.
   */
  public computeIndexChecksum(): string {
    const sortedKeys = Array.from(this.byStorageKey.keys()).sort();
    const entries: Record<string, unknown>[] = [];
    for (let i = 0; i < sortedKeys.length; i++) {
      const ref = this.byStorageKey.get(sortedKeys[i])!;
      entries.push({
        storageKey: ref.storageKey,
        objectId: ref.objectId,
        tenantId: ref.tenantId,
        domain: ref.domain,
        stateVersion: ref.stateVersion,
        checksum: ref.checksum,
        cellId: ref.cellId ?? null,
        address369: ref.address369 ?? null,
      });
    }

    return computeMathChecksum({
      mathType: 'NATIVE_MEMORY_INDEX',
      entries,
    });
  }

  /**
   * Deterministically serializes the memory index into sorted JSON.
   */
  public serializeIndex(): string {
    const sortedKeys = Array.from(this.byStorageKey.keys()).sort();
    const sortedRefs: MemoryIndexReference[] = [];
    for (let i = 0; i < sortedKeys.length; i++) {
      sortedRefs.push(this.byStorageKey.get(sortedKeys[i])!);
    }
    const checksum = this.computeIndexChecksum();

    return JSON.stringify(
      {
        mathType: 'NATIVE_MEMORY_INDEX',
        entryCount: sortedRefs.length,
        checksum,
        references: sortedRefs,
      },
      null,
      2
    );
  }

  /**
   * Gathers aggregate metrics for the memory index.
   */
  public getStats(): IndexStats {
    return Object.freeze({
      totalEntries: this.byStorageKey.size,
      tenantCount: this.byTenant.size,
      spatialEntries: Array.from(this.byCellId.values()).reduce((sum, s) => sum + s.size, 0),
      occupiedCells: this.byCellId.size,
      occupiedAddresses: this.byAddress369.size,
      estimatedSizeBytes: this.byStorageKey.size * 180, // ~180 bytes per reference
    });
  }

  /**
   * Clears all primary and secondary index structures.
   */
  public clear(): void {
    this.byStorageKey.clear();
    this.byTenant.clear();
    this.byObjectId.clear();
    this.byDomain.clear();
    this.byCellId.clear();
    this.byAddress369.clear();
  }

  /**
   * Total number of indexed reference pointers.
   */
  public size(): number {
    return this.byStorageKey.size;
  }
}
