/**
 * CUBiO AI — Task 24: On-Demand Memory Retrieval
 * Phase 2 — Native Memory
 * src/cubio/memory/native/onDemandRetriever.ts
 *
 * Lightweight, bounded, deterministic on-demand memory retrieval engine.
 *
 * GUARANTEES:
 * 1. Bounded Retrieval: Strict enforcement of maxRecords and maxBytes limits.
 * 2. Lazy Materialization: Uses Task 23 index pointers to evaluate candidates;
 *    materializes full payloads from Task 22 store only on demand.
 * 3. Deterministic Ordering: Lexicographical sort by storageKey ensures bit-exact reproducibility.
 * 4. Tenant Isolation & Integrity: Enforces tenant boundaries and cryptographic SHA-256 checks.
 * 5. Spatial Authority: Delegates spatial resolution strictly to src/core/address369.ts.
 * 6. Zero Premature Features: 0 neural scoring, 0 replay, 0 consolidation, 0 forgetting.
 */

import {
  cellIdToAddress369,
  address369ToCellId,
  validateCellId,
  validateAddress,
  isSpatialAddress,
} from '../../../core/address369';

import {
  DEFAULT_TENANT_ID,
} from '../../core/canonicalIdentity';

import {
  NativeSparseMemoryStore,
  computeRecordChecksum,
} from './sparseMemoryStore';
import { NativeMemoryIndex } from './memoryIndex';
import { NativeMemoryRecord } from './types';
import { MemoryIndexReference } from './indexTypes';
import {
  MemoryRetrievalQuery,
  MemoryRetrievalResult,
  DEFAULT_MAX_RETRIEVAL_RECORDS,
  MAX_ALLOWED_RETRIEVAL_RECORDS,
  DEFAULT_MAX_RETRIEVAL_BYTES,
  MAX_ALLOWED_RETRIEVAL_BYTES,
} from './retrievalTypes';

import {
  NativeMemoryValidationError,
  assertValidObjectId,
  assertValidTenantId,
} from './validation';

export class NativeOnDemandRetriever {
  public constructor(
    private readonly store: NativeSparseMemoryStore,
    private readonly index: NativeMemoryIndex,
  ) {}

  /**
   * Retrieves bounded memory records on-demand according to query criteria.
   */
  public retrieve(query: MemoryRetrievalQuery = {}): MemoryRetrievalResult {
    const t0 = performance.now();

    // 1. Validate tenant ID
    const tenantId = query.tenantId?.trim() || DEFAULT_TENANT_ID;
    assertValidTenantId(tenantId);

    // 2. Validate bounds
    const maxRecords = query.maxRecords !== undefined ? query.maxRecords : DEFAULT_MAX_RETRIEVAL_RECORDS;
    if (typeof maxRecords !== 'number' || !Number.isInteger(maxRecords) || maxRecords <= 0) {
      throw new NativeMemoryValidationError(
        `maxRecords must be a positive integer, received: ${maxRecords}`
      );
    }
    const effectiveMaxRecords = Math.min(maxRecords, MAX_ALLOWED_RETRIEVAL_RECORDS);

    const maxBytes = query.maxBytes !== undefined ? query.maxBytes : DEFAULT_MAX_RETRIEVAL_BYTES;
    if (typeof maxBytes !== 'number' || !Number.isInteger(maxBytes) || maxBytes <= 0) {
      throw new NativeMemoryValidationError(
        `maxBytes must be a positive integer, received: ${maxBytes}`
      );
    }
    const effectiveMaxBytes = Math.min(maxBytes, MAX_ALLOWED_RETRIEVAL_BYTES);

    // 3. Validate spatial inputs if present
    let targetCellId: number | undefined;
    if (query.cellId !== undefined) {
      validateCellId(query.cellId);
      targetCellId = query.cellId;
    }
    if (query.address369 !== undefined) {
      validateAddress(query.address369);
      if (!isSpatialAddress(query.address369)) {
        throw new NativeMemoryValidationError(
          `Address ${query.address369} is symbolic [0..25] and does not index spatial memory`
        );
      }
      const derivedCell = address369ToCellId(query.address369);
      if (targetCellId !== undefined && targetCellId !== derivedCell) {
        throw new NativeMemoryValidationError(
          `Conflicting spatial query: cellId=${targetCellId} does not match address369=${query.address369} (derived cellId=${derivedCell})`
        );
      }
      targetCellId = derivedCell;
    }

    // 4. Validate object ID inputs if present
    if (query.objectId !== undefined) {
      assertValidObjectId(query.objectId);
    }
    if (query.objectIds !== undefined) {
      if (!Array.isArray(query.objectIds)) {
        throw new NativeMemoryValidationError('objectIds must be an array of strings');
      }
      for (let i = 0; i < query.objectIds.length; i++) {
        assertValidObjectId(query.objectIds[i]);
      }
    }

    // 5. Candidate Resolution via NativeMemoryIndex (zero full records materialized)
    let candidateRefs: MemoryIndexReference[] = [];

    if (query.objectId !== undefined) {
      const ref = this.index.lookupByObjectId(query.objectId, tenantId);
      if (ref) {
        candidateRefs.push(ref);
      }
    } else if (query.objectIds !== undefined && query.objectIds.length > 0) {
      const seen = new Set<string>();
      for (let i = 0; i < query.objectIds.length; i++) {
        const oid = query.objectIds[i].trim();
        if (seen.has(oid)) {
          continue;
        }
        seen.add(oid);
        const ref = this.index.lookupByObjectId(oid, tenantId);
        if (ref) {
          candidateRefs.push(ref);
        }
      }
    } else if (targetCellId !== undefined) {
      candidateRefs = Array.from(this.index.lookupByCellId(targetCellId, tenantId));
    } else if (query.domain !== undefined) {
      candidateRefs = Array.from(this.index.lookupByDomain(query.domain, tenantId));
    } else {
      candidateRefs = Array.from(this.index.lookupByTenant(tenantId));
    }

    // Secondary reference-level filtering (domain, spatial, tenant)
    if (query.domain !== undefined && query.objectId !== undefined) {
      candidateRefs = candidateRefs.filter((ref) => ref.domain === query.domain);
    }
    if (targetCellId !== undefined && (query.objectId !== undefined || query.objectIds !== undefined)) {
      candidateRefs = candidateRefs.filter((ref) => ref.cellId === targetCellId);
    }
    // Strict tenant boundary check on candidates
    candidateRefs = candidateRefs.filter((ref) => ref.tenantId === tenantId);

    // 6. Deterministic Ordering: Lexicographical sort by canonical storageKey
    candidateRefs.sort((a, b) => (a.storageKey < b.storageKey ? -1 : a.storageKey > b.storageKey ? 1 : 0));

    const totalCandidatesCount = candidateRefs.length;

    // 7. Lazy On-Demand Materialization with Budget & Integrity Guards
    const materialized: NativeMemoryRecord[] = [];
    let totalBytesLoaded = 0;
    let truncatedByMaxRecords = false;
    let truncatedByMaxBytes = false;
    let rejectionsCount = 0;
    const verifyChecksum = query.verifyChecksum !== false;

    for (let i = 0; i < candidateRefs.length; i++) {
      // Check record budget limit
      if (materialized.length >= effectiveMaxRecords) {
        truncatedByMaxRecords = true;
        break;
      }

      const candidate = candidateRefs[i];

      // Materialize single record from persistent sparse store
      const record = this.store.get(candidate.objectId, tenantId);

      // Stale index reference check
      if (!record) {
        rejectionsCount++;
        continue;
      }

      // Tenant boundary guard
      if (record.identity.tenantId !== tenantId) {
        rejectionsCount++;
        continue;
      }

      // Version guard check
      if (query.expectedVersion !== undefined && record.identity.stateVersion !== query.expectedVersion) {
        rejectionsCount++;
        continue;
      }

      // State version and checksum consistency check between index pointer and record
      if (record.identity.stateVersion !== candidate.stateVersion || record.identity.checksum !== candidate.checksum) {
        rejectionsCount++;
        continue;
      }

      // Tag filter check
      if (query.tags && query.tags.length > 0) {
        const recordTagSet = new Set(record.metadata.tags);
        const hasAllTags = query.tags.every((t) => recordTagSet.has(t.trim()));
        if (!hasAllTags) {
          continue;
        }
      }

      // Check byte budget limit
      const recordBytes = record.metadata.sizeBytes;
      if (totalBytesLoaded + recordBytes > effectiveMaxBytes) {
        truncatedByMaxBytes = true;
        break;
      }

      // Cryptographic checksum re-verification (tampering / corruption guard)
      if (verifyChecksum) {
        const parentChecksum = record.integrity.parentRecordChecksum;
        const expectedRecordChecksum = computeRecordChecksum(
          record.storageKey,
          record.identity,
          record.state.checksum,
          record.metadata,
          parentChecksum
        );

        if (record.integrity.checksum !== expectedRecordChecksum) {
          rejectionsCount++;
          continue;
        }
      }

      // Record accepted
      materialized.push(record);
      totalBytesLoaded += recordBytes;
    }

    const t1 = performance.now();
    const durationMs = Math.round((t1 - t0) * 100) / 100;

    return Object.freeze({
      records: Object.freeze(materialized),
      stats: Object.freeze({
        candidateCount: totalCandidatesCount,
        materializedCount: materialized.length,
        totalBytesLoaded,
        truncatedByMaxRecords,
        truncatedByMaxBytes,
        rejectionsCount,
        durationMs,
      }),
    });
  }

  /**
   * Fast-path exact lookup by universal objectId and optional tenantId.
   */
  public retrieveByObjectId(objectId: string, tenantId = DEFAULT_TENANT_ID): NativeMemoryRecord | null {
    assertValidObjectId(objectId);
    assertValidTenantId(tenantId);

    const ref = this.index.lookupByObjectId(objectId, tenantId);
    if (!ref) {
      return null;
    }

    const record = this.store.get(objectId, tenantId);
    if (!record) {
      return null;
    }

    if (record.identity.tenantId !== tenantId || record.identity.stateVersion !== ref.stateVersion) {
      return null;
    }

    return record;
  }

  /**
   * Convenience retrieval by spatial cellId [0..342].
   */
  public retrieveByCellId(
    cellId: number,
    options: Omit<MemoryRetrievalQuery, 'cellId' | 'address369'> = {}
  ): MemoryRetrievalResult {
    return this.retrieve({ ...options, cellId });
  }

  /**
   * Convenience retrieval by spatial address [26..368].
   */
  public retrieveByAddress369(
    address369: number,
    options: Omit<MemoryRetrievalQuery, 'cellId' | 'address369'> = {}
  ): MemoryRetrievalResult {
    return this.retrieve({ ...options, address369 });
  }
}
