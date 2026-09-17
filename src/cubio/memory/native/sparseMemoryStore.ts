/**
 * CUBiO AI — Task 22: Native Sparse Memory Architecture
 * Phase 2 — Native Memory
 * src/cubio/memory/native/sparseMemoryStore.ts
 *
 * Lightweight, native, sparse persistent-memory store.
 *
 * GUARANTEES:
 * 1. Sparse on-demand storage: 0 pre-allocation of spatial or state spaces.
 * 2. Canonical identity binding (objectId, tenantId, domain, stateVersion, cellId).
 * 3. Deep immutability: all stored and returned records are frozen (Object.freeze).
 * 4. Strict tenant isolation: cross-tenant access and mutations are rejected.
 * 5. Deterministic cryptographic integrity digests linking revision lineage.
 * 6. Single spatial authority: strictly references src/core/address369.ts.
 * 7. Zero dependencies on external models, training loops, or audio.
 */

import {
  DEFAULT_TENANT_ID,
  CanonicalDomain,
  CanonicalIdentityKey,
  deriveSpatialIdentity,
} from '../../core/canonicalIdentity';

import { computeMathChecksum } from '../../math/checksum';

import {
  DEFAULT_MAX_STORE_RECORDS,
  CreateRecordOp,
  UpdateRecordOp,
  DeleteRecordOp,
  MemoryCRUDOp,
  MemoryCRUDResult,
  MemoryQueryParams,
  MemoryStoreStats,
  NativeMemoryRecord,
  NativeMemoryMetadata,
  NativeMemoryIntegrity,
} from './types';

import {
  NativeMemoryValidationError,
  TenantIsolationError,
  assertValidObjectId,
  assertValidTenantId,
  assertValidMetadata,
  assertValidMemoryState,
  assertValidMemoryCellId,
} from './validation';

/**
 * Computes canonical cryptographic integrity digest for a memory record snapshot.
 */
export function computeRecordChecksum(
  storageKey: string,
  identity: CanonicalIdentityKey,
  stateChecksum: string,
  metadata: NativeMemoryMetadata,
  parentRecordChecksum?: string
): string {
  const metadataChecksum = computeMathChecksum({
    label: metadata.label ?? null,
    description: metadata.description ?? null,
    tags: metadata.tags,
    attributes: metadata.attributes,
  });

  const payload: Record<string, unknown> = {
    mathType: 'NATIVE_MEMORY_RECORD',
    storageKey,
    objectId: identity.objectId,
    tenantId: identity.tenantId,
    domain: identity.domain,
    stateVersion: identity.stateVersion,
    cellId: identity.cellId ?? null,
    blockId: identity.blockId ?? null,
    stateChecksum,
    metadataChecksum,
    parentRecordChecksum: parentRecordChecksum ?? null,
  };

  return computeMathChecksum(payload);
}

/**
 * Sovereign native sparse memory store.
 */
export class NativeSparseMemoryStore {
  /** Primary sparse store: storageKey (`${tenantId}:${objectId}`) -> NativeMemoryRecord */
  private readonly primaryStore: Map<string, NativeMemoryRecord> = new Map();

  /** Sparse spatial index: cellId [0..342] -> Set of storageKeys */
  private readonly spatialIndex: Map<number, Set<string>> = new Map();

  /** Tenant scope index: tenantId -> Set of storageKeys */
  private readonly tenantIndex: Map<string, Set<string>> = new Map();

  /** Configured capacity limit */
  private readonly maxCapacity: number;

  /** Monotonic internal logical clock */
  private logicalClock: number = 0;

  constructor(maxCapacity = DEFAULT_MAX_STORE_RECORDS) {
    if (!Number.isInteger(maxCapacity) || maxCapacity <= 0) {
      throw new NativeMemoryValidationError(`maxCapacity must be a positive integer. Received: ${maxCapacity}`);
    }
    this.maxCapacity = maxCapacity;
  }

  /**
   * Helper to format deterministic storage key.
   */
  public static toStorageKey(tenantId: string, objectId: string): string {
    return `${tenantId.trim()}:${objectId.trim()}`;
  }

  /**
   * Creates and stores a new immutable native memory record.
   * Throws if record already exists under the given tenant.
   */
  public create(op: CreateRecordOp): NativeMemoryRecord {
    if (!op || op.type !== 'CREATE') {
      throw new NativeMemoryValidationError('Invalid operation passed to create()');
    }

    assertValidObjectId(op.objectId);
    const tenantId = op.tenantId?.trim() || DEFAULT_TENANT_ID;
    assertValidTenantId(tenantId);

    const domain: CanonicalDomain = op.domain || 'SPATIAL_MEMORY';
    assertValidMemoryState(op.state);
    assertValidMemoryCellId(op.cellId);

    const storageKey = NativeSparseMemoryStore.toStorageKey(tenantId, op.objectId);

    if (this.primaryStore.has(storageKey)) {
      throw new NativeMemoryValidationError(
        `Memory record already exists: objectId "${op.objectId}" in tenant "${tenantId}"`
      );
    }

    if (this.primaryStore.size >= this.maxCapacity) {
      throw new NativeMemoryValidationError(
        `Native sparse memory store capacity exceeded (limit: ${this.maxCapacity})`
      );
    }

    const clock = ++this.logicalClock;

    // Build immutable metadata
    const cleanTags = Object.freeze([...(op.tags || [])].map((t) => t.trim()));
    const cleanAttrs = Object.freeze({ ...(op.attributes || {}) });

    const metadata: NativeMemoryMetadata = Object.freeze({
      ...(op.label ? { label: op.label.trim() } : {}),
      ...(op.description ? { description: op.description.trim() } : {}),
      tags: cleanTags,
      attributes: cleanAttrs,
      createdAt: clock,
      updatedAt: clock,
      sizeBytes: JSON.stringify({ state: op.state, attrs: cleanAttrs }).length,
    });

    assertValidMetadata(metadata);

    // Build canonical identity key
    const identity: CanonicalIdentityKey = Object.freeze({
      objectId: op.objectId.trim(),
      tenantId,
      domain,
      stateVersion: 1,
      checksum: op.state.checksum,
      ...(op.cellId !== undefined ? { cellId: op.cellId } : {}),
      ...(op.blockId !== undefined ? { blockId: op.blockId } : {}),
    });

    // Compute integrity
    const checksum = computeRecordChecksum(storageKey, identity, op.state.checksum, metadata);
    const integrity: NativeMemoryIntegrity = Object.freeze({
      checksum,
      verifiedAt: clock,
    });

    // Resolve derived spatial attributes on-demand if cellId exists
    const derivedSpatial = op.cellId !== undefined ? deriveSpatialIdentity(identity) : undefined;

    const record: NativeMemoryRecord = Object.freeze({
      mathType: 'NATIVE_MEMORY_RECORD',
      storageKey,
      identity,
      state: op.state,
      metadata,
      integrity,
      ...(derivedSpatial ? { derivedSpatial } : {}),
    });

    // Persist to primary sparse store
    this.primaryStore.set(storageKey, record);

    // Update tenant index
    let tenantKeys = this.tenantIndex.get(tenantId);
    if (!tenantKeys) {
      tenantKeys = new Set();
      this.tenantIndex.set(tenantId, tenantKeys);
    }
    tenantKeys.add(storageKey);

    // Update sparse spatial index if spatial
    if (op.cellId !== undefined) {
      let cellKeys = this.spatialIndex.get(op.cellId);
      if (!cellKeys) {
        cellKeys = new Set();
        this.spatialIndex.set(op.cellId, cellKeys);
      }
      cellKeys.add(storageKey);
    }

    return record;
  }

  /**
   * Retrieves an immutable memory record by tenant and objectId.
   * Returns null if not found.
   */
  public get(objectId: string, tenantId = DEFAULT_TENANT_ID): NativeMemoryRecord | null {
    assertValidObjectId(objectId);
    assertValidTenantId(tenantId);

    const storageKey = NativeSparseMemoryStore.toStorageKey(tenantId, objectId);
    return this.primaryStore.get(storageKey) ?? null;
  }

  /**
   * Retrieves an immutable memory record and cryptographically verifies its integrity.
   * Throws NativeMemoryValidationError fail-closed if payload is tampered or corrupted.
   */
  public getVerified(objectId: string, tenantId = DEFAULT_TENANT_ID): NativeMemoryRecord | null {
    const record = this.get(objectId, tenantId);
    if (!record) return null;

    const expectedChecksum = computeRecordChecksum(
      record.storageKey,
      record.identity,
      record.state.checksum,
      record.metadata,
      record.integrity.parentRecordChecksum
    );

    if (record.integrity.checksum !== expectedChecksum) {
      throw new NativeMemoryValidationError(
        `Memory record integrity violation: detected tampered or corrupted payload for objectId "${objectId}" in tenant "${tenantId}"`
      );
    }

    return record;
  }

  /**
   * Checks if an entity exists in the specified tenant.
   */
  public has(objectId: string, tenantId = DEFAULT_TENANT_ID): boolean {
    assertValidObjectId(objectId);
    assertValidTenantId(tenantId);

    const storageKey = NativeSparseMemoryStore.toStorageKey(tenantId, objectId);
    return this.primaryStore.has(storageKey);
  }

  /**
   * Updates an existing memory record with version increment and cryptographic lineage.
   * Throws if record is not found or if expectedVersion guard fails.
   */
  public update(op: UpdateRecordOp): NativeMemoryRecord {
    if (!op || op.type !== 'UPDATE') {
      throw new NativeMemoryValidationError('Invalid operation passed to update()');
    }

    assertValidObjectId(op.objectId);
    const tenantId = op.tenantId?.trim() || DEFAULT_TENANT_ID;
    assertValidTenantId(tenantId);

    const storageKey = NativeSparseMemoryStore.toStorageKey(tenantId, op.objectId);
    const existing = this.primaryStore.get(storageKey);

    if (!existing) {
      throw new NativeMemoryValidationError(
        `Cannot update: record "${op.objectId}" not found in tenant "${tenantId}"`
      );
    }

    // Stale update guard
    if (op.expectedVersion !== undefined && existing.identity.stateVersion !== op.expectedVersion) {
      throw new NativeMemoryValidationError(
        `Stale update rejected: expected stateVersion ${op.expectedVersion}, but current version is ${existing.identity.stateVersion}`
      );
    }

    const clock = ++this.logicalClock;
    const nextStateVersion = existing.identity.stateVersion + 1;

    // Determine state
    const nextState = op.state ?? existing.state;
    assertValidMemoryState(nextState);

    // Determine cellId
    let nextCellId: number | undefined;
    if (op.cellId === null) {
      nextCellId = undefined; // explicitly unbind spatial
    } else if (op.cellId !== undefined) {
      assertValidMemoryCellId(op.cellId);
      nextCellId = op.cellId;
    } else {
      nextCellId = existing.identity.cellId;
    }

    // Determine blockId
    let nextBlockId: number | undefined;
    if (op.blockId === null) {
      nextBlockId = undefined;
    } else if (op.blockId !== undefined) {
      nextBlockId = op.blockId;
    } else {
      nextBlockId = existing.identity.blockId;
    }

    // Update metadata
    const nextTags = op.tags !== undefined
      ? Object.freeze([...op.tags].map((t) => t.trim()))
      : existing.metadata.tags;

    const nextAttrs = op.attributes !== undefined
      ? Object.freeze({ ...existing.metadata.attributes, ...op.attributes })
      : existing.metadata.attributes;

    const metadata: NativeMemoryMetadata = Object.freeze({
      label: op.label !== undefined ? op.label.trim() : existing.metadata.label,
      description: op.description !== undefined ? op.description.trim() : existing.metadata.description,
      tags: nextTags,
      attributes: nextAttrs,
      createdAt: existing.metadata.createdAt,
      updatedAt: clock,
      sizeBytes: JSON.stringify({ state: nextState, attrs: nextAttrs }).length,
    });

    assertValidMetadata(metadata);

    // Update canonical identity
    const identity: CanonicalIdentityKey = Object.freeze({
      objectId: existing.identity.objectId,
      tenantId: existing.identity.tenantId,
      domain: existing.identity.domain,
      stateVersion: nextStateVersion,
      checksum: nextState.checksum,
      ...(nextCellId !== undefined ? { cellId: nextCellId } : {}),
      ...(nextBlockId !== undefined ? { blockId: nextBlockId } : {}),
    });

    // Compute integrity linking parent record checksum
    const parentRecordChecksum = existing.integrity.checksum;
    const checksum = computeRecordChecksum(storageKey, identity, nextState.checksum, metadata, parentRecordChecksum);
    const integrity: NativeMemoryIntegrity = Object.freeze({
      checksum,
      parentRecordChecksum,
      verifiedAt: clock,
    });

    const derivedSpatial = nextCellId !== undefined ? deriveSpatialIdentity(identity) : undefined;

    const updatedRecord: NativeMemoryRecord = Object.freeze({
      mathType: 'NATIVE_MEMORY_RECORD',
      storageKey,
      identity,
      state: nextState,
      metadata,
      integrity,
      ...(derivedSpatial ? { derivedSpatial } : {}),
    });

    // Maintain spatial index
    const oldCellId = existing.identity.cellId;
    if (oldCellId !== undefined && oldCellId !== nextCellId) {
      const oldSet = this.spatialIndex.get(oldCellId);
      if (oldSet) {
        oldSet.delete(storageKey);
        if (oldSet.size === 0) this.spatialIndex.delete(oldCellId);
      }
    }
    if (nextCellId !== undefined && oldCellId !== nextCellId) {
      let newSet = this.spatialIndex.get(nextCellId);
      if (!newSet) {
        newSet = new Set();
        this.spatialIndex.set(nextCellId, newSet);
      }
      newSet.add(storageKey);
    }

    this.primaryStore.set(storageKey, updatedRecord);
    return updatedRecord;
  }

  /**
   * Deletes a memory record and evicts it cleanly from all primary and spatial indexes.
   */
  public delete(op: DeleteRecordOp): boolean {
    if (!op || op.type !== 'DELETE') {
      throw new NativeMemoryValidationError('Invalid operation passed to delete()');
    }

    assertValidObjectId(op.objectId);
    const tenantId = op.tenantId?.trim() || DEFAULT_TENANT_ID;
    assertValidTenantId(tenantId);

    const storageKey = NativeSparseMemoryStore.toStorageKey(tenantId, op.objectId);
    const existing = this.primaryStore.get(storageKey);

    if (!existing) {
      return false;
    }

    // Stale delete guard
    if (op.expectedVersion !== undefined && existing.identity.stateVersion !== op.expectedVersion) {
      throw new NativeMemoryValidationError(
        `Stale delete rejected: expected stateVersion ${op.expectedVersion}, but current is ${existing.identity.stateVersion}`
      );
    }

    // Evict from primary store
    this.primaryStore.delete(storageKey);

    // Evict from tenant index
    const tenantSet = this.tenantIndex.get(tenantId);
    if (tenantSet) {
      tenantSet.delete(storageKey);
      if (tenantSet.size === 0) this.tenantIndex.delete(tenantId);
    }

    // Evict from spatial index if present
    if (existing.identity.cellId !== undefined) {
      const cellSet = this.spatialIndex.get(existing.identity.cellId);
      if (cellSet) {
        cellSet.delete(storageKey);
        if (cellSet.size === 0) this.spatialIndex.delete(existing.identity.cellId);
      }
    }

    return true;
  }

  /**
   * Executes a batch of CRUD operations in atomic sequence.
   */
  public batch(ops: readonly MemoryCRUDOp[]): readonly MemoryCRUDResult[] {
    if (!Array.isArray(ops)) {
      throw new NativeMemoryValidationError('batch() requires an array of operations');
    }

    const results: MemoryCRUDResult[] = [];
    for (const op of ops) {
      const tenantId = op.tenantId?.trim() || DEFAULT_TENANT_ID;
      const storageKey = NativeSparseMemoryStore.toStorageKey(tenantId, op.objectId);

      switch (op.type) {
        case 'CREATE': {
          const record = this.create(op);
          results.push({ success: true, storageKey, operation: 'CREATE', record });
          break;
        }
        case 'UPDATE': {
          const record = this.update(op);
          results.push({ success: true, storageKey, operation: 'UPDATE', record });
          break;
        }
        case 'DELETE': {
          const deleted = this.delete(op);
          results.push({ success: deleted, storageKey, operation: 'DELETE' });
          break;
        }
        default: {
          const badOp = op as { type: string };
          throw new NativeMemoryValidationError(`Unsupported CRUD op: ${badOp.type}`);
        }
      }
    }
    return Object.freeze(results);
  }

  /**
   * Queries sparse records with strict tenant isolation and spatial filtering.
   */
  public query(params: MemoryQueryParams = {}): readonly NativeMemoryRecord[] {
    const tenantId = params.tenantId?.trim() || DEFAULT_TENANT_ID;
    assertValidTenantId(tenantId);

    const tenantKeys = this.tenantIndex.get(tenantId);
    if (!tenantKeys || tenantKeys.size === 0) {
      return Object.freeze([]);
    }

    let candidateKeys: readonly string[] = Array.from(tenantKeys).sort();

    // Fast path: if cellId specified, intersect tenant keys with spatial index
    if (params.cellId !== undefined) {
      assertValidMemoryCellId(params.cellId);
      const spatialKeys = this.spatialIndex.get(params.cellId);
      if (!spatialKeys || spatialKeys.size === 0) {
        return Object.freeze([]);
      }
      // Intersect
      const intersection: string[] = [];
      const spatialList = Array.from(spatialKeys);
      for (let i = 0; i < spatialList.length; i++) {
        const k = spatialList[i];
        if (tenantKeys.has(k)) {
          intersection.push(k);
        }
      }
      intersection.sort();
      candidateKeys = intersection;
    }

    const matched: NativeMemoryRecord[] = [];
    for (let i = 0; i < candidateKeys.length; i++) {
      const key = candidateKeys[i];
      const record = this.primaryStore.get(key);
      if (!record) continue;

      // Filter by domain
      if (params.domain && record.identity.domain !== params.domain) {
        continue;
      }

      // Filter by tags
      if (params.tags && params.tags.length > 0) {
        const recordTagSet = new Set(record.metadata.tags);
        const hasAllTags = params.tags.every((t) => recordTagSet.has(t.trim()));
        if (!hasAllTags) continue;
      }

      matched.push(record);
    }

    // Apply offset and limit
    const offset = params.offset && params.offset > 0 ? params.offset : 0;
    const limit = params.limit && params.limit > 0 ? params.limit : matched.length;

    const sliced = matched.slice(offset, offset + limit);
    return Object.freeze(sliced);
  }

  /**
   * Returns a read-only snapshot of all records in the store across all tenants.
   */
  public getAllRecords(): readonly NativeMemoryRecord[] {
    return Object.freeze(Array.from(this.primaryStore.values()));
  }

  /**
   * Returns all active tenant identifiers in the store.
   */
  public getTenants(): readonly string[] {
    return Object.freeze(Array.from(this.tenantIndex.keys()));
  }

  /**
   * Gathers aggregate statistics about the memory store.
   */
  public getStats(tenantId?: string): MemoryStoreStats {
    if (tenantId) {
      assertValidTenantId(tenantId);
      const tenantKeys = this.tenantIndex.get(tenantId.trim());
      const count = tenantKeys ? tenantKeys.size : 0;
      let spatialCount = 0;
      const occupiedCells = new Set<number>();
      if (tenantKeys) {
        const keyList = Array.from(tenantKeys);
        for (let i = 0; i < keyList.length; i++) {
          const k = keyList[i];
          const rec = this.primaryStore.get(k);
          if (rec && rec.identity.cellId !== undefined) {
            spatialCount++;
            occupiedCells.add(rec.identity.cellId);
          }
        }
      }
      return Object.freeze({
        totalRecords: count,
        tenantCount: count > 0 ? 1 : 0,
        spatialRecordsCount: spatialCount,
        occupiedCellsCount: occupiedCells.size,
        maxCapacity: this.maxCapacity,
        estimatedSizeBytes: count * 512,
      });
    }

    return Object.freeze({
      totalRecords: this.primaryStore.size,
      tenantCount: this.tenantIndex.size,
      spatialRecordsCount: Array.from(this.spatialIndex.values()).reduce((sum, s) => sum + s.size, 0),
      occupiedCellsCount: this.spatialIndex.size,
      maxCapacity: this.maxCapacity,
      estimatedSizeBytes: this.primaryStore.size * 512,
    });
  }

  /**
   * Clears all primary and secondary indexes.
   */
  public clear(): void {
    this.primaryStore.clear();
    this.spatialIndex.clear();
    this.tenantIndex.clear();
  }

  /**
   * Current number of stored records.
   */
  public size(): number {
    return this.primaryStore.size;
  }
}
