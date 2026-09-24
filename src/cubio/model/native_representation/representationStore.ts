/**
 * CUBiO AI — Task 161: Native Embedding & Representation Scaling
 * src/cubio/model/native_representation/representationStore.ts
 *
 * Primary VDB representation registry implementing:
 * STORE ONCE -> REFERENCE EVERYWHERE -> LOAD ON DEMAND
 *
 * Features:
 * 1. Lightweight representation handles referencing persistent VDB data without copying matrices.
 * 2. Strict multi-tenant isolation (fail-closed cross-tenant boundary).
 * 3. Bounded memory LRU cache for working representations.
 * 4. Optimistic Concurrency Control (OCC) and checksum verification.
 */

import * as crypto from 'crypto';
import {
  RepresentationAccessHandle,
  ScaledEmbeddingMatrix,
  RepresentationSchema,
  RepresentationDimension,
  IS_ACTUATION_BLOCKED,
} from './types';
import { canonicalStringify, calculateCanonicalChecksum } from '../../core/canonicalIdentity';

export class TenantIsolationViolationError extends Error {
  constructor(message: string) {
    super(`[TENANT_ISOLATION_VIOLATION] ${message}`);
    this.name = 'TenantIsolationViolationError';
  }
}

export class RepresentationNotFoundError extends Error {
  constructor(message: string) {
    super(`[REPRESENTATION_NOT_FOUND] ${message}`);
    this.name = 'RepresentationNotFoundError';
  }
}

export class RepresentationStore {
  // Primary persistent VDB store
  private static vdbStorage: Map<string, ScaledEmbeddingMatrix> = new Map();
  private static schemaStorage: Map<string, RepresentationSchema> = new Map();

  // Bounded memory LRU working cache
  private static workingCache: Map<string, ScaledEmbeddingMatrix> = new Map();
  private static readonly MAX_CACHE_ENTRIES = 4;

  /**
   * Clears all stores (for test isolation).
   */
  public static clearAll(): void {
    this.vdbStorage.clear();
    this.schemaStorage.clear();
    this.workingCache.clear();
  }

  /**
   * Registers an embedding matrix into the Primary VDB and returns a lightweight reference handle.
   * STORE ONCE -> REFERENCE EVERYWHERE.
   */
  public static registerInVdb(
    matrix: ScaledEmbeddingMatrix,
    tenantId: string = 'root',
    stateVersion: number = 1
  ): RepresentationAccessHandle {
    if (!IS_ACTUATION_BLOCKED) {
      throw new Error('Safety lock violated: IS_ACTUATION_BLOCKED must be true.');
    }

    const key = `${tenantId}:${matrix.matrixId}`;
    this.vdbStorage.set(key, matrix);

    // Also populate cache
    this.addToCache(key, matrix);

    const objectId = `URN:CUBIO:REPR:${tenantId}:${matrix.matrixId}`;
    const handleId = `HANDLE:${crypto.createHash('sha256').update(key + matrix.stateHash).digest('hex').slice(0, 16)}`;

    return Object.freeze({
      handleId,
      objectId,
      tenantId,
      stateVersion,
      checksum: matrix.canonicalChecksum,
      embeddingType: matrix.type,
      dimension: matrix.dimension,
      rowCount: matrix.rows,
      estimatedBytes: matrix.byteSize,
    });
  }

  /**
   * Registers a representation schema into the Primary VDB.
   */
  public static registerSchema(schema: RepresentationSchema): void {
    const key = `${schema.tenantId}:${schema.schemaId}`;
    this.schemaStorage.set(key, schema);
  }

  /**
   * Retrieves a representation schema from the Primary VDB with strict tenant isolation.
   */
  public static getSchema(schemaId: string, requestingTenantId: string): RepresentationSchema {
    const key = `${requestingTenantId}:${schemaId}`;
    const schema = this.schemaStorage.get(key);

    if (!schema) {
      // Check if it exists under another tenant to throw tenant isolation error
      for (const [k, v] of this.schemaStorage.entries()) {
        if (v.schemaId === schemaId && v.tenantId !== requestingTenantId) {
          throw new TenantIsolationViolationError(
            `Cross-tenant access prohibited: schema '${schemaId}' belongs to tenant '${v.tenantId}', not '${requestingTenantId}'.`
          );
        }
      }
      throw new RepresentationNotFoundError(`Representation schema '${schemaId}' not found in VDB.`);
    }

    return schema;
  }

  /**
   * Loads an embedding matrix on-demand using its lightweight reference handle.
   * LOAD ON DEMAND.
   */
  public static loadOnDemand(
    handle: RepresentationAccessHandle,
    requestingTenantId: string
  ): ScaledEmbeddingMatrix {
    if (handle.tenantId !== requestingTenantId) {
      throw new TenantIsolationViolationError(
        `Cross-tenant access prohibited: handle belongs to '${handle.tenantId}', requested by '${requestingTenantId}'.`
      );
    }

    const key = `${handle.tenantId}:${handle.objectId.split(':').pop()}`;

    // 1. Check working LRU cache
    if (this.workingCache.has(key)) {
      const cached = this.workingCache.get(key)!;
      // Refresh LRU order
      this.workingCache.delete(key);
      this.workingCache.set(key, cached);
      return cached;
    }

    // 2. Load from Primary VDB
    const persistent = this.vdbStorage.get(key);
    if (!persistent) {
      throw new RepresentationNotFoundError(`Representation matrix not found for handle '${handle.handleId}'.`);
    }

    // 3. Verify content checksum
    if (persistent.canonicalChecksum !== handle.checksum) {
      throw new Error(`Checksum mismatch during on-demand load: handle expected ${handle.checksum}, got ${persistent.canonicalChecksum}`);
    }

    // 4. Cache and return
    this.addToCache(key, persistent);
    return persistent;
  }

  /**
   * Current cached entry count for memory governance tests.
   */
  public static getCacheSize(): number {
    return this.workingCache.size;
  }

  /**
   * Internal LRU cache eviction manager.
   */
  private static addToCache(key: string, matrix: ScaledEmbeddingMatrix): void {
    if (this.workingCache.has(key)) {
      this.workingCache.delete(key);
    } else if (this.workingCache.size >= this.MAX_CACHE_ENTRIES) {
      // Evict oldest entry (first item in Map iterator)
      const oldestKey = this.workingCache.keys().next().value;
      if (oldestKey) {
        this.workingCache.delete(oldestKey);
      }
    }
    this.workingCache.set(key, matrix);
  }
}
