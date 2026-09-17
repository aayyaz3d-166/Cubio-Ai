/**
 * CUBiO AI — Task 24: On-Demand Memory Retrieval
 * Phase 2 — Native Memory
 * src/cubio/memory/native/retrievalTypes.ts
 *
 * Formal type definitions for bounded, deterministic on-demand memory retrieval.
 */

import { CanonicalDomain } from '../../core/canonicalIdentity';
import { NativeMemoryRecord } from './types';

/**
 * Standard budget limits for retrieval queries to prevent memory saturation.
 */
export const DEFAULT_MAX_RETRIEVAL_RECORDS = 50;
export const MAX_ALLOWED_RETRIEVAL_RECORDS = 1_000;
export const DEFAULT_MAX_RETRIEVAL_BYTES = 1_048_576; // 1 MB
export const MAX_ALLOWED_RETRIEVAL_BYTES = 10_485_760; // 10 MB

/**
 * Specification for an on-demand memory retrieval request.
 */
export interface MemoryRetrievalQuery {
  /**
   * Scoped tenant identifier. Defaults to DEFAULT_TENANT_ID ('root').
   */
  readonly tenantId?: string;

  /**
   * Universal object identifier for exact single-item retrieval.
   */
  readonly objectId?: string;

  /**
   * Explicit array of universal object identifiers for batch retrieval.
   */
  readonly objectIds?: readonly string[];

  /**
   * Canonical spatial cell identifier [0..342].
   */
  readonly cellId?: number;

  /**
   * Canonical spatial address [26..368].
   */
  readonly address369?: number;

  /**
   * Domain filter.
   */
  readonly domain?: CanonicalDomain;

  /**
   * Tags filter. All specified tags must be present on matched records.
   */
  readonly tags?: readonly string[];

  /**
   * Maximum number of records to materialize (budget limit).
   * Defaults to DEFAULT_MAX_RETRIEVAL_RECORDS (50).
   * Upper bound capped at MAX_ALLOWED_RETRIEVAL_RECORDS (1,000).
   */
  readonly maxRecords?: number;

  /**
   * Maximum payload bytes to materialize across all returned records (budget limit).
   * Defaults to DEFAULT_MAX_RETRIEVAL_BYTES (1 MB).
   * Upper bound capped at MAX_ALLOWED_RETRIEVAL_BYTES (10 MB).
   */
  readonly maxBytes?: number;

  /**
   * Whether to strictly re-verify cryptographic checksum of each record upon materialization.
   * Defaults to true.
   */
  readonly verifyChecksum?: boolean;

  /**
   * Expected state version guard. When set, records with differing stateVersion are rejected.
   */
  readonly expectedVersion?: number;
}

/**
 * Operational telemetry and budget statistics for a retrieval execution.
 */
export interface MemoryRetrievalStats {
  /** Total lightweight candidate reference pointers inspected from index */
  readonly candidateCount: number;

  /** Total full memory records materialized from store */
  readonly materializedCount: number;

  /** Sum of sizeBytes for all successfully materialized records */
  readonly totalBytesLoaded: number;

  /** Whether the retrieval was halted due to reaching maxRecords */
  readonly truncatedByMaxRecords: boolean;

  /** Whether the retrieval was halted due to reaching maxBytes */
  readonly truncatedByMaxBytes: boolean;

  /** Count of candidate references rejected due to staleness, corruption, or version mismatch */
  readonly rejectionsCount: number;

  /** Wall-clock execution time in milliseconds */
  readonly durationMs: number;
}

/**
 * Bounded result payload returned by on-demand retrieval.
 */
export interface MemoryRetrievalResult {
  /** Materialized, immutable memory records matching the query within budget limits */
  readonly records: readonly NativeMemoryRecord[];

  /** Telemetry and accounting statistics */
  readonly stats: MemoryRetrievalStats;
}
