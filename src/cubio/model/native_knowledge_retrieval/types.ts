/**
 * CUBiO AI — Task 189: Native Knowledge Indexing and Retrieval
 * src/cubio/model/native_knowledge_retrieval/types.ts
 *
 * Universal contracts, query specifications, index descriptors, and domain
 * error classes for native knowledge indexing and selective retrieval.
 *
 * STRICT INVARIANTS:
 * 1. Hardware Actuation Lockout: IS_ACTUATION_BLOCKED === true permanently.
 * 2. VDB Primacy: VDB is sole persistent authority; selective indexes store references only.
 * 3. Zero Full-VDB Loading: In-memory indexes operate on lightweight descriptors.
 * 4. Materialization On Demand: Payloads fetched only when requested, with checksum validation.
 * 5. Determinism: 100% native tokenization, spatial metrics, and multi-factor ranking.
 */

import {
  KnowledgeEpistemicStatus,
} from '../native_knowledge_architecture/types';

export const TASK_189_ID = 'CUBIO-TASK-189-KNOWLEDGE-INDEXING-RETRIEVAL';
export const IS_ACTUATION_BLOCKED = true;

export type KnowledgeObjectType =
  | 'ENTITY'
  | 'CONCEPT'
  | 'FACT'
  | 'RELATIONSHIP'
  | 'EVIDENCE';

/**
 * Lightweight in-memory index entry.
 * Completely avoids storing heavy full-payload JSON in RAM.
 */
export interface KnowledgeIndexEntry {
  readonly objectId: string;
  readonly objectType: KnowledgeObjectType;
  readonly label: string;
  readonly tokens: readonly string[];
  readonly category: string;
  readonly address369: number;
  readonly cellId343?: number;
  readonly tenantId: string;
  readonly stateVersion: number;
  readonly checksum: string;
  readonly epistemicStatus: KnowledgeEpistemicStatus;
  readonly provenanceDepth: number; // e.g. evidence count or derivation steps
}

/**
 * Multi-facet query specification for selective retrieval.
 */
export interface KnowledgeRetrievalQuery {
  readonly query: string;
  readonly tenantId: string;
  readonly objectTypes?: readonly KnowledgeObjectType[];
  readonly spatialFocalAddress?: number; // Euler 369 address for spatial affinity
  readonly spatialMaxRadius?: number;
  readonly epistemicFilter?: readonly KnowledgeEpistemicStatus[];
  readonly categoryFilter?: readonly string[];
  readonly page?: number;                // 1-indexed, default 1
  readonly pageSize?: number;            // Default 20, max 100
  readonly minScore?: number;            // Minimum composite score [0.0..1.0]
  readonly weights?: {
    readonly relevance?: number;         // Default 0.40
    readonly epistemic?: number;         // Default 0.25
    readonly provenance?: number;        // Default 0.15
    readonly spatial?: number;           // Default 0.20
  };
}

/**
 * Detailed score breakdown for ranked retrieval results.
 */
export interface KnowledgeRetrievalRankedItem {
  readonly ref: KnowledgeIndexEntry;
  readonly relevanceScore: number;       // [0.0..1.0]
  readonly epistemicScore: number;       // [0.0..1.0]
  readonly provenanceScore: number;      // [0.0..1.0]
  readonly spatialScore: number;         // [0.0..1.0]
  readonly compositeScore: number;       // [0.0..1.0]
  readonly rank: number;                 // 1-indexed
}

/**
 * Paged retrieval response.
 */
export interface KnowledgeRetrievalPageResult {
  readonly query: string;
  readonly tenantId: string;
  readonly totalMatched: number;
  readonly page: number;
  readonly pageSize: number;
  readonly totalPages: number;
  readonly items: readonly KnowledgeRetrievalRankedItem[];
  readonly retrievalDigest: string;      // Deterministic SHA-256 digest
}

/**
 * Full payload materialized on demand from primary VDB.
 */
export interface MaterializedKnowledgePayload {
  readonly ref: KnowledgeIndexEntry;
  readonly payload: Record<string, unknown>;
  readonly checksumValid: boolean;
  readonly occVerified: boolean;
}

/**
 * Error classes for retrieval and materialization boundaries.
 */
export class RetrievalChecksumMismatchError extends Error {
  constructor(objectId: string, expected: string, actual: string) {
    super(
      `[RetrievalChecksumMismatchError] Checksum mismatch for object "${objectId}": expected ${expected}, found ${actual}. Record is corrupt. Rejecting fail-closed.`
    );
    this.name = 'RetrievalChecksumMismatchError';
  }
}

export class RetrievalOCCCollisionError extends Error {
  constructor(objectId: string, expectedVersion: number, actualVersion: number) {
    super(
      `[RetrievalOCCCollisionError] OCC version collision on object "${objectId}": index expected version ${expectedVersion}, but VDB stored version ${actualVersion}.`
    );
    this.name = 'RetrievalOCCCollisionError';
  }
}

export class RetrievalTenantViolationError extends Error {
  constructor(callerTenant: string, targetTenant: string) {
    super(
      `[RetrievalTenantViolationError] Cross-tenant retrieval operation rejected: caller "${callerTenant}" cannot access target "${targetTenant}".`
    );
    this.name = 'RetrievalTenantViolationError';
  }
}

export class RetrievalPagingLimitError extends Error {
  constructor(param: string, value: number, maxAllowed: number) {
    super(
      `[RetrievalPagingLimitError] Paging parameter "${param}" value ${value} exceeds maximum allowed ${maxAllowed}.`
    );
    this.name = 'RetrievalPagingLimitError';
  }
}

export class RetrievalActuationBlockedError extends Error {
  constructor(directive: string) {
    super(
      `[RetrievalActuationBlockedError] Hardware actuation directive "${directive}" detected. Permanently rejected fail-closed.`
    );
    this.name = 'RetrievalActuationBlockedError';
  }
}
