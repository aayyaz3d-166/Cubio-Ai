/**
 * CUBiO AI — 3D Memory Studio
 * AGENT-001 — MEA (Memory Agent)
 * src/cubio/agents/mea/types.ts
 *
 * Authoritative type contracts for CUBiO's native Memory Agent.
 * Ensures targeted context retrieval, relevance scoring, bounded output,
 * provenance integrity, and zero duplicate storage.
 */

export type MEASourceType =
  | 'PROJECT_MEMORY'
  | 'FORENSIC_INDEX'
  | 'VDB_REFERENCE'
  | 'APPROVED_STORE';

export interface MEAQuery {
  /** Target subsystem IDs (e.g. 'SPATIAL_369', 'DATABASE_VDB', 'NATIVE_VISION') */
  readonly subsystems?: readonly string[];
  /** Target Task IDs (e.g. 'TASK31', 'TASK27', 'INT-001') */
  readonly taskIds?: readonly string[];
  /** Search keywords for relevance scoring */
  readonly keywords?: readonly string[];
  /** File path patterns or substrings to filter on */
  readonly filePatterns?: readonly string[];
  /** Target spatial cell ID (0..342) */
  readonly cellId?: number;
  /** Target Address369 string */
  readonly address369?: string;
  /** Target memory tiers (e.g. 'SHORT_TERM', 'LONG_TERM', 'STATE_MEMORY') */
  readonly memoryTiers?: readonly string[];
  /** Minimum relevance score cutoff (0.0 to 1.0, default: 0.1) */
  readonly minRelevanceScore?: number;
  /** Tenant isolation identifier */
  readonly tenantId?: string;
  /** ISO date range filter */
  readonly startDate?: string;
  readonly endDate?: string;
}

export interface MEABudget {
  /** Maximum allowable estimated tokens in context output (default: 1024) */
  readonly maxTokens: number;
  /** Maximum allowable bytes in context output (default: 8192) */
  readonly maxBytes: number;
  /** Maximum number of records to return (default: 10) */
  readonly maxItems: number;
  /** If true, emits ultra-compact token-efficient representation (default: true) */
  readonly compact: boolean;
  /** If true, includes full payload; if false, emits bounded snippet (default: false) */
  readonly includeRawPayloads: boolean;
}

export interface MEARetrievedItem {
  readonly id: string;
  readonly sourceType: MEASourceType;
  readonly sourcePathOrKey: string;
  readonly title: string;
  readonly snippet: string;
  readonly relevanceScore: number;
  readonly byteSize: number;
  readonly estimatedTokens: number;
  readonly provenanceHash: string;
  readonly timestamp: string;
  readonly metadata: Readonly<Record<string, unknown>>;
}

export interface MEAContextBundle {
  readonly agentId: 'AGENT-001-MEA';
  readonly version: '1.0.0';
  readonly query: MEAQuery;
  readonly budget: MEABudget;
  readonly totalCandidatesFound: number;
  readonly itemsIncluded: number;
  readonly totalEstimatedTokens: number;
  readonly totalBytes: number;
  readonly budgetExceeded: boolean;
  readonly truncated: boolean;
  readonly compactText: string;
  readonly items: readonly MEARetrievedItem[];
  readonly masterProvenanceHash: string;
  readonly executionTimeMs: number;
  readonly rxLifecycleId?: string;
}

export interface MEASafetyStatus {
  readonly is_actuation_blocked: boolean;
  readonly external_ai_dependencies: number;
  readonly canonical_db_unmutated: boolean;
  readonly address369_unmutated: boolean;
}

export const DEFAULT_MEA_BUDGET: MEABudget = Object.freeze({
  maxTokens: 1024,
  maxBytes: 8192,
  maxItems: 10,
  compact: true,
  includeRawPayloads: false,
});
