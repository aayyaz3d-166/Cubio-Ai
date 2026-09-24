/**
 * CUBiO AI — Task 174: Hierarchical Context Memory
 * src/cubio/model/native_hierarchical_memory/types.ts
 *
 * Universal contracts, memory levels, reference interfaces, and domain
 * error classes for native hierarchical context memory (L1 -> L2 -> L3 -> L4).
 *
 * STRICT INVARIANTS:
 * 1. Zero foreign libraries (no LangChain, LlamaIndex, vector DB clients).
 * 2. VDB remains PRIMARY persistent memory authority; .3dmemory is checkpoint/transport only.
 * 3. References in memory rather than duplicating full text into every context window.
 * 4. Promotion/demotion based on relevance, access frequency, and epistemic provenance.
 * 5. Strict multi-tenant isolation, OCC state versioning, and SHA-256 verification.
 * 6. Permanent hardware actuation lockout: IS_ACTUATION_BLOCKED === true.
 */

export const TASK_174_ID = 'CUBIO-TASK-174-HIERARCHICAL-CONTEXT-MEMORY';
export const IS_ACTUATION_BLOCKED = true;

/**
 * Hierarchical memory levels spanning working tokens to canonical persistent VDB.
 */
export const MemoryLevel = {
  L1_LOCAL: 'L1_LOCAL',                 // Active working context (materialized tokens in RAM)
  L2_SESSION: 'L2_SESSION',             // Session turn history & working references
  L3_LONG_TERM: 'L3_LONG_TERM',         // Cross-session thematic/episodic references
  L4_CANONICAL_VDB: 'L4_CANONICAL_VDB', // Primary VDB persistent authoritative storage
} as const;

export type MemoryLevel = (typeof MemoryLevel)[keyof typeof MemoryLevel];

/**
 * Epistemic statuses permitted for promotion to canonical persistent memory.
 */
export const CANONICAL_EPISTEMIC_STATUSES = Object.freeze(['FACT', 'AXIOM', 'DERIVED']);

/**
 * Lightweight reference representing a context entity across memory tiers.
 * Stored in RAM without holding bulk text payloads.
 */
export interface HierarchicalReference {
  readonly referenceId: string;
  readonly objectId: string;
  readonly chunkId?: string;
  readonly level: MemoryLevel;
  readonly tenantId: string;
  readonly tokenCount: number;
  readonly byteLength: number;
  readonly checksum: string; // SHA-256 of raw content
  readonly relevanceScore: number; // 0.0 to 1.0
  readonly accessCount: number;
  readonly lastAccessedTimestamp: string;
  readonly epistemicStatus: string;
  readonly version: number; // OCC version number (v >= 0)
  readonly spatialCellId?: number; // 0..342
  readonly isPinnedAnchor: boolean;
  readonly summary: string; // Bounded summary (<= 64 chars)
  readonly provenance: {
    readonly sourceDocId?: string;
    readonly sessionId?: string;
    readonly taskId: string;
    readonly createdAt: string;
  };
}

/**
 * Materialized active token entry in L1 Local memory.
 */
export interface L1MaterializedEntry {
  readonly referenceId: string;
  readonly objectId: string;
  readonly tenantId: string;
  readonly tokens: readonly number[];
  readonly content: string;
  readonly tokenCount: number;
  readonly checksum: string;
  readonly loadedAtTimestamp: string;
  readonly isPinnedAnchor: boolean;
}

/**
 * Configuration for hierarchical memory bounds and promotion policies.
 */
export interface HierarchicalConfig {
  readonly maxL1ActiveTokens: number;             // Default: 2048
  readonly maxL2SessionRefs: number;              // Default: 64
  readonly maxL3LongTermRefs: number;             // Default: 256
  readonly l2ToL3PromotionMinRelevance: number;   // Default: 0.70
  readonly l2ToL3PromotionMinAccessCount: number; // Default: 2
  readonly l3ToL4PromotionMinRelevance: number;   // Default: 0.85
  readonly epistemicDecayFactor: number;          // Default: 0.05
}

/**
 * Result of a deterministic hierarchical retrieval query.
 */
export interface HierarchicalRetrievalResult {
  readonly query: string;
  readonly tenantId: string;
  readonly matches: readonly {
    readonly reference: HierarchicalReference;
    readonly retrievedFromLevel: MemoryLevel;
    readonly matchedContent?: string; // Materialized if requested
    readonly combinedScore: number;
  }[];
  readonly totalRetrievedTokens: number;
  readonly queryLatencyMs: number;
  readonly retrievalDigest: string; // Deterministic SHA-256 digest
}

/**
 * Record of a promotion or demotion transition.
 */
export interface LevelTransitionEvent {
  readonly referenceId: string;
  readonly objectId: string;
  readonly tenantId: string;
  readonly fromLevel: MemoryLevel;
  readonly toLevel: MemoryLevel;
  readonly triggerReason: string;
  readonly oldVersion: number;
  readonly newVersion: number;
  readonly timestamp: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Domain Errors
// ─────────────────────────────────────────────────────────────────────────────

export class HierarchicalMemoryError extends Error {
  public readonly code: string;

  constructor(message: string, code: string) {
    super(`[HierarchicalMemory] ${message}`);
    this.name = 'HierarchicalMemoryError';
    this.code = code;
  }
}

export class HierarchicalMemoryTenantViolationError extends HierarchicalMemoryError {
  public readonly expectedTenant: string;
  public readonly actualTenant: string;

  constructor(expectedTenant: string, actualTenant: string) {
    super(
      `Tenant Isolation Violation: Caller tenant "${expectedTenant}" attempted unauthorized access to memory belonging to tenant "${actualTenant}". Access blocked fail-closed.`,
      'HIERARCHICAL_TENANT_ISOLATION_VIOLATION'
    );
    this.name = 'HierarchicalMemoryTenantViolationError';
    this.expectedTenant = expectedTenant;
    this.actualTenant = actualTenant;
  }
}

export class HierarchicalMemoryOCCConflictError extends HierarchicalMemoryError {
  public readonly referenceId: string;
  public readonly expectedVersion: number;
  public readonly actualVersion: number;

  constructor(referenceId: string, expectedVersion: number, actualVersion: number) {
    super(
      `Optimistic Concurrency Control Conflict on reference "${referenceId}": expected version ${expectedVersion}, found version ${actualVersion}. State write rejected.`,
      'HIERARCHICAL_OCC_CONFLICT'
    );
    this.name = 'HierarchicalMemoryOCCConflictError';
    this.referenceId = referenceId;
    this.expectedVersion = expectedVersion;
    this.actualVersion = actualVersion;
  }
}

export class HierarchicalMemoryIntegrityError extends HierarchicalMemoryError {
  public readonly referenceId: string;

  constructor(referenceId: string, details: string) {
    super(
      `Cryptographic integrity failure on reference "${referenceId}": ${details}. Tamper detection fail-closed.`,
      'HIERARCHICAL_INTEGRITY_VIOLATION'
    );
    this.name = 'HierarchicalMemoryIntegrityError';
    this.referenceId = referenceId;
  }
}

export class IllegalHierarchicalPromotionError extends HierarchicalMemoryError {
  public readonly referenceId: string;
  public readonly epistemicStatus: string;

  constructor(referenceId: string, epistemicStatus: string, reason: string) {
    super(
      `Illegal canonical promotion for reference "${referenceId}" with status "${epistemicStatus}": ${reason}. Anti-pollution guard enforced.`,
      'ILLEGAL_HIERARCHICAL_PROMOTION'
    );
    this.name = 'IllegalHierarchicalPromotionError';
    this.referenceId = referenceId;
    this.epistemicStatus = epistemicStatus;
  }
}

export class HierarchicalMemoryActuationBlockedError extends HierarchicalMemoryError {
  public readonly directive: string;

  constructor(directive: string) {
    super(
      `Hardware Actuation Blocked: Hierarchical memory layer rejected command "${directive}". Physical actuation permanently prohibited.`,
      'HARDWARE_ACTUATION_PROHIBITED'
    );
    this.name = 'HierarchicalMemoryActuationBlockedError';
    this.directive = directive;
  }
}

export class HierarchicalCapacityExceededError extends HierarchicalMemoryError {
  public readonly level: MemoryLevel;
  public readonly currentSize: number;
  public readonly maxSize: number;

  constructor(level: MemoryLevel, currentSize: number, maxSize: number) {
    super(
      `Capacity exceeded at level "${level}": current count ${currentSize} exceeds limit ${maxSize}. Demotion or eviction required.`,
      'HIERARCHICAL_CAPACITY_EXCEEDED'
    );
    this.name = 'HierarchicalCapacityExceededError';
    this.level = level;
    this.currentSize = currentSize;
    this.maxSize = maxSize;
  }
}
