/**
 * CUBiO AI — Task 23: Memory Address / Index Layer
 * Phase 2 — Native Memory
 * src/cubio/memory/native/indexTypes.ts
 *
 * Types and interfaces for the lightweight native memory index.
 *
 * GUARANTEES:
 * 1. Index entries are lightweight reference pointers, NOT full memory payloads.
 * 2. Multi-axis indexing: objectId, tenantId, domain, cellId, address369.
 * 3. Spatial addresses derived strictly via src/core/address369.ts.
 * 4. Sparse on-demand storage: zero dense pre-allocation.
 */

import { CanonicalDomain } from '../../core/canonicalIdentity';

/**
 * Lightweight reference pointer representing an indexed memory entity.
 * Points to the underlying memory record without duplicating the full payload.
 */
export interface MemoryIndexReference {
  /** Canonical storage key: `${tenantId}:${objectId}` */
  readonly storageKey: string;
  /** Universal entity identifier */
  readonly objectId: string;
  /** Tenant isolation scope */
  readonly tenantId: string;
  /** Canonical architectural domain */
  readonly domain: CanonicalDomain;
  /** Monotonically increasing revision counter (>= 1) */
  readonly stateVersion: number;
  /** Cryptographic SHA-256 integrity digest of the entity state */
  readonly checksum: string;
  /** Optional spatial lattice cell ID [0..342] */
  readonly cellId?: number;
  /** Optional spatial 369 address [26..368] derived strictly via address369.ts */
  readonly address369?: number;
  /** Serialized payload byte size */
  readonly sizeBytes: number;
  /** Revision logical timestamp */
  readonly updatedAt: number;
}

/**
 * Diagnostic report produced after rebuilding the index from persistent storage.
 */
export interface IndexRebuildReport {
  readonly indexedCount: number;
  readonly spatialEntriesCount: number;
  readonly tenantCount: number;
  readonly domainCounts: Readonly<Record<string, number>>;
  readonly durationMs: number;
  readonly checksum: string;
}

/**
 * Query filter parameters for multi-axis index lookups.
 */
export interface IndexQueryFilter {
  readonly tenantId?: string;
  readonly domain?: CanonicalDomain;
  readonly cellId?: number;
  readonly address369?: number;
  readonly limit?: number;
  readonly offset?: number;
}

/**
 * Aggregate metrics of the native memory index.
 */
export interface IndexStats {
  readonly totalEntries: number;
  readonly tenantCount: number;
  readonly spatialEntries: number;
  readonly occupiedCells: number;
  readonly occupiedAddresses: number;
  readonly estimatedSizeBytes: number;
}
