/**
 * CUBiO AI — Task 22: Native Sparse Memory Architecture
 * Phase 2 — Native Memory
 * src/cubio/memory/native/types.ts
 *
 * Types, interfaces, and bounds for the native sparse persistent-memory abstraction.
 *
 * CORE ARCHITECTURAL PRINCIPLES:
 * 1. Sparse, on-demand storage: never preallocate the theoretical state space.
 * 2. Canonical object identity binding: (objectId, tenantId, domain, stateVersion, cellId).
 * 3. Deterministic mathematical state integration (Phase 1 mathematical core).
 * 4. Deep immutability: all stored and returned records are frozen.
 * 5. Strict tenant isolation: cross-tenant mutations or unauthorized reads are rejected.
 * 6. Explicit typed CRUD operations.
 * 7. Single spatial authority: references src/core/address369.ts exclusively.
 */

import { CanonicalDomain, CanonicalIdentityKey, DerivedSpatialIdentity } from '../../core/canonicalIdentity';
import { DeterministicState } from '../../math/engine/types';
import { NativeMathValue } from '../../math/types';

/** Maximum character length for entity objectId */
export const MAX_OBJECT_ID_LENGTH = 256;

/** Maximum character length for tenant identifier */
export const MAX_TENANT_ID_LENGTH = 128;

/** Maximum number of tags allowed per memory record */
export const MAX_TAGS_COUNT = 32;

/** Maximum character length for an individual tag */
export const MAX_TAG_LENGTH = 64;

/** Maximum number of custom metadata attributes */
export const MAX_ATTRIBUTES_COUNT = 64;

/** Maximum serialized byte size for custom metadata (64 KB) */
export const MAX_METADATA_BYTES = 65536;

/** Default capacity limit for native sparse memory store */
export const DEFAULT_MAX_STORE_RECORDS = 10000;

/**
 * Structured content metadata associated with a native memory record.
 */
export interface NativeMemoryMetadata {
  readonly label?: string;
  readonly description?: string;
  readonly tags: readonly string[];
  readonly attributes: Readonly<Record<string, string | number | boolean>>;
  readonly createdAt: number;
  readonly updatedAt: number;
  readonly sizeBytes: number;
}

/**
 * Deterministic cryptographic integrity record for a native memory item.
 */
export interface NativeMemoryIntegrity {
  /** Canonical SHA-256 digest of identity + state + metadata */
  readonly checksum: string;
  /** Cryptographic hash of predecessor record version for revision lineage */
  readonly parentRecordChecksum?: string;
  /** Microsecond or timestamp of last integrity verification */
  readonly verifiedAt: number;
}

/**
 * Immutable native memory record snapshot.
 */
export interface NativeMemoryRecord {
  readonly mathType: 'NATIVE_MEMORY_RECORD';
  /** Canonical storage key: `${tenantId}:${objectId}` */
  readonly storageKey: string;
  /** Universal Canonical Identity */
  readonly identity: CanonicalIdentityKey;
  /** Discrete mathematical state snapshot from Phase 1 */
  readonly state: DeterministicState | NativeMathValue;
  /** Bounded content metadata */
  readonly metadata: NativeMemoryMetadata;
  /** Cryptographic integrity data */
  readonly integrity: NativeMemoryIntegrity;
  /** Derived spatial coordinates from cellId (derived on-demand via address369.ts) */
  readonly derivedSpatial?: DerivedSpatialIdentity;
}

/** Operation to create a new native memory record */
export interface CreateRecordOp {
  readonly type: 'CREATE';
  readonly objectId: string;
  readonly tenantId?: string; // defaults to 'root'
  readonly domain?: CanonicalDomain; // defaults to 'SPATIAL_MEMORY'
  readonly state: DeterministicState | NativeMathValue;
  readonly cellId?: number;
  readonly blockId?: number;
  readonly label?: string;
  readonly description?: string;
  readonly tags?: readonly string[];
  readonly attributes?: Readonly<Record<string, string | number | boolean>>;
}

/** Operation to update an existing native memory record */
export interface UpdateRecordOp {
  readonly type: 'UPDATE';
  readonly objectId: string;
  readonly tenantId?: string; // defaults to 'root'
  readonly state?: DeterministicState | NativeMathValue;
  readonly cellId?: number | null; // null explicitly removes spatial binding
  readonly blockId?: number | null;
  readonly label?: string;
  readonly description?: string;
  readonly tags?: readonly string[];
  readonly attributes?: Readonly<Record<string, string | number | boolean>>;
  /** Enforces that current stateVersion === expectedVersion */
  readonly expectedVersion?: number;
}

/** Operation to delete an existing native memory record */
export interface DeleteRecordOp {
  readonly type: 'DELETE';
  readonly objectId: string;
  readonly tenantId?: string; // defaults to 'root'
  /** Optional version guard */
  readonly expectedVersion?: number;
}

/** Discriminated union of all explicit typed CRUD operations */
export type MemoryCRUDOp = CreateRecordOp | UpdateRecordOp | DeleteRecordOp;

/** Result of a CRUD operation */
export interface MemoryCRUDResult {
  readonly success: boolean;
  readonly storageKey: string;
  readonly operation: 'CREATE' | 'UPDATE' | 'DELETE';
  readonly record?: NativeMemoryRecord;
  readonly error?: string;
}

/** Query parameters for filtering sparse memory records */
export interface MemoryQueryParams {
  readonly tenantId?: string;
  readonly domain?: CanonicalDomain;
  readonly cellId?: number;
  readonly tags?: readonly string[];
  readonly limit?: number;
  readonly offset?: number;
}

/** Aggregate statistics of the native sparse memory store */
export interface MemoryStoreStats {
  readonly totalRecords: number;
  readonly tenantCount: number;
  readonly spatialRecordsCount: number;
  readonly occupiedCellsCount: number;
  readonly maxCapacity: number;
  readonly estimatedSizeBytes: number;
}
