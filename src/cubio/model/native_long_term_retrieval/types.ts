/**
 * CUBiO AI — Task 176: Long-Term VDB Memory Retrieval
 * src/cubio/model/native_long_term_retrieval/types.ts
 *
 * Universal contracts, query specifications, index interfaces, and domain
 * error classes for native long-term VDB memory retrieval.
 *
 * STRICT INVARIANTS:
 * 1. Zero foreign libraries (no LangChain, LlamaIndex, ChromaDB, Pinecone, FAISS).
 * 2. Primary VDB remains the authoritative persistent brain; never replaced by external DB.
 * 3. Zero full-database loading into RAM during normal long-context turns.
 * 4. Selective, bounded context assembly constrained by token budgets.
 * 5. Strict multi-tenant isolation, OCC state integrity, and SHA-256 verification.
 * 6. Permanent hardware actuation lockout: IS_ACTUATION_BLOCKED === true.
 */

import { CanonicalMemoryReference, ModelMemoryRecord } from '../native_memory_integration/types.js';

export const TASK_176_ID = 'CUBIO-TASK-176-LONG-TERM-VDB-MEMORY-RETRIEVAL';
export const IS_ACTUATION_BLOCKED = true;

/**
 * Multi-facet query specification for selective long-term VDB retrieval.
 */
export interface LongTermRetrievalQuery {
  readonly query: string;
  readonly tenantId: string;
  readonly tokenBudget?: number;            // Default: 2048 tokens
  readonly spatialCellId?: number;          // 0..342 for 3D HCP spatial lattice filtering
  readonly domain?: string;                 // Domain namespace filtering
  readonly epistemicFilter?: readonly string[]; // e.g. ['FACT', 'AXIOM']
  readonly minRelevance?: number;           // Default: 0.15
  readonly limit?: number;                  // Maximum reference matches (default: 20)
  readonly materializeContent?: boolean;    // Whether to fetch full text from VDB (default: true)
}

/**
 * Result of a deterministic long-term VDB retrieval.
 */
export interface LongTermRetrievalResult {
  readonly query: string;
  readonly tenantId: string;
  readonly matchedReferences: readonly CanonicalMemoryReference[];
  readonly materializedRecords: readonly ModelMemoryRecord[];
  readonly totalTokens: number;
  readonly totalByteLength: number;
  readonly latencyMs: number;
  readonly memoryFootprintBytes: number;
  readonly retrievalDigest: string; // Deterministic SHA-256 digest
}

/**
 * Statistics of the lightweight in-memory reference index.
 */
export interface IndexStats {
  readonly tenantId: string;
  readonly totalIndexedReferences: number;
  readonly indexedTermsCount: number;
  readonly indexedSpatialCellsCount: number;
  readonly indexMemoryBytes: number;
}

/**
 * Benchmark metrics report for retrieval latency, memory, and determinism.
 */
export interface RetrievalBenchmarkReport {
  readonly tenantId: string;
  readonly totalReferencesIndexed: number;
  readonly totalQueriesTested: number;
  readonly meanLatencyMs: number;
  readonly p95LatencyMs: number;
  readonly maxLatencyMs: number;
  readonly peakMemoryBytes: number;
  readonly isBitwiseDeterministic: boolean;
  readonly timestamp: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Domain Errors
// ─────────────────────────────────────────────────────────────────────────────

export class LongTermRetrievalError extends Error {
  public readonly code: string;

  constructor(message: string, code: string) {
    super(`[LongTermVDBRetrieval] ${message}`);
    this.name = 'LongTermRetrievalError';
    this.code = code;
  }
}

export class LongTermRetrievalTenantViolationError extends LongTermRetrievalError {
  public readonly expectedTenant: string;
  public readonly actualTenant: string;

  constructor(expectedTenant: string, actualTenant: string) {
    super(
      `Tenant Isolation Violation: Caller tenant "${expectedTenant}" attempted access to long-term memory owned by "${actualTenant}". Access blocked fail-closed.`,
      'RETRIEVAL_TENANT_VIOLATION'
    );
    this.name = 'LongTermRetrievalTenantViolationError';
    this.expectedTenant = expectedTenant;
    this.actualTenant = actualTenant;
  }
}

export class LongTermRetrievalIntegrityError extends LongTermRetrievalError {
  public readonly objectId: string;

  constructor(objectId: string, details: string) {
    super(
      `Cryptographic integrity failure on object "${objectId}": ${details}. Tamper detection fail-closed.`,
      'RETRIEVAL_INTEGRITY_VIOLATION'
    );
    this.name = 'LongTermRetrievalIntegrityError';
    this.objectId = objectId;
  }
}

export class LongTermRetrievalActuationBlockedError extends LongTermRetrievalError {
  public readonly directive: string;

  constructor(directive: string) {
    super(
      `Hardware Actuation Blocked: Long-term retrieval layer rejected directive "${directive}". Physical actuation permanently prohibited.`,
      'HARDWARE_ACTUATION_PROHIBITED'
    );
    this.name = 'LongTermRetrievalActuationBlockedError';
    this.directive = directive;
  }
}

export class LongTermRetrievalBudgetExceededError extends LongTermRetrievalError {
  public readonly currentTokens: number;
  public readonly budgetLimit: number;

  constructor(currentTokens: number, budgetLimit: number) {
    super(
      `Token budget ceiling exceeded: requested ${currentTokens} tokens exceeds budget ceiling ${budgetLimit}.`,
      'RETRIEVAL_TOKEN_BUDGET_EXCEEDED'
    );
    this.name = 'LongTermRetrievalBudgetExceededError';
    this.currentTokens = currentTokens;
    this.budgetLimit = budgetLimit;
  }
}
