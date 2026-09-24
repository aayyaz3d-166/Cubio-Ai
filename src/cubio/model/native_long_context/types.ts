/**
 * CUBiO AI — Task 171: Native Long-Context Architecture
 * src/cubio/model/native_long_context/types.ts
 *
 * Universal contracts, profile definitions, and domain errors for native
 * scalable long-context processing (1K -> 4K -> 16K -> 32K -> 128K -> 256K -> 1M).
 *
 * STRICT INVARIANTS:
 * 1. Zero foreign attention / long-context libraries (no FlashAttention, vLLM, xFormers, DeepSpeed, Triton).
 * 2. VDB remains PRIMARY persistent memory authority; .3dmemory remains checkpoint/transport only.
 * 3. Load-on-demand & canonical reference indexing instead of indiscriminate bulk RAM loading.
 * 4. Strict tenant isolation, OCC state versioning, SHA-256 checksums, and provenance preservation.
 * 5. Bounded resource controls failing closed on violation.
 * 6. Permanent hardware actuation lockout: IS_ACTUATION_BLOCKED === true.
 */

export const TASK_171_ID = 'CUBIO-TASK-171-NATIVE-LONG-CONTEXT-ARCHITECTURE';
export const IS_ACTUATION_BLOCKED = true;

/**
 * Approved native long-context scale profiles spanning 1K to 1M tokens.
 */
export const LongContextProfileId = {
  LONG_1K: 'LONG_1K',       // 1,024 tokens
  LONG_4K: 'LONG_4K',       // 4,096 tokens
  LONG_16K: 'LONG_16K',     // 16,384 tokens
  LONG_32K: 'LONG_32K',     // 32,768 tokens
  LONG_128K: 'LONG_128K',   // 131,072 tokens
  LONG_256K: 'LONG_256K',   // 262,144 tokens
  LONG_1M: 'LONG_1M',       // 1,048,576 tokens
} as const;

export type LongContextProfileId = (typeof LongContextProfileId)[keyof typeof LongContextProfileId];

/**
 * Attention routing mechanisms for long-context scales.
 */
export type LongContextAttentionRouting =
  | 'DENSE_CAUSAL'          // Exact causal attention for 1K - 4K
  | 'BLOCK_SPARSE'          // Block-sparse hierarchical attention for 16K - 32K
  | 'HIERARCHICAL_SLIDING'; // Hierarchical sliding window + global anchors for 128K - 1M

/**
 * Architectural specification for a long-context profile.
 */
export interface LongContextProfileSpec {
  readonly profileId: LongContextProfileId;
  readonly maxTokens: number;
  readonly defaultChunkSizeTokens: number;
  readonly maxChunks: number;
  readonly maxResidentBlocks: number;
  readonly maxResidentRamBytes: number;
  readonly routingMechanism: LongContextAttentionRouting;
  readonly description: string;
}

/**
 * An individual metadata index entry representing a canonical context block.
 * Held in RAM within the reference index without storing the full string payload.
 */
export interface LongContextIndexEntry {
  readonly chunkId: string;
  readonly objectId: string;
  readonly tenantId: string;
  readonly tokenStart: number;
  readonly tokenEnd: number;
  readonly tokenCount: number;
  readonly stateVersion: number;
  readonly checksum: string; // SHA-256 of content
  readonly spatialCellId?: number; // 0..342 HCP cell mapping
  readonly epistemicStatus: string; // FACT, OBSERVATION, etc.
  readonly isPinned: boolean; // Pinned blocks survive eviction
  readonly contentSummary: string; // Bounded brief preview (<= 64 chars)
  readonly byteLength: number;
  readonly createdAt: string;
}

/**
 * A resident context block loaded into working memory on demand.
 */
export interface LongContextResidentBlock {
  readonly entry: LongContextIndexEntry;
  readonly content: string; // The full string content, loaded on demand
  readonly loadedAt: number;
  lastAccessedAt: number;
  accessCount: number;
}

/**
 * Query criteria for searching the native long-context index.
 */
export interface LongContextQuery {
  readonly tenantId: string;
  readonly queryText?: string;
  readonly tokenRange?: [number, number];
  readonly spatialCellId?: number;
  readonly epistemicStatus?: string;
  readonly maxBlocks?: number;
  readonly includePinned?: boolean;
}

/**
 * Result of context assembly for a target profile and prompt/query.
 */
export interface LongContextAssemblyResult {
  readonly profileId: LongContextProfileId;
  readonly maxCapacityTokens: number;
  readonly totalTokensAssembled: number;
  readonly assembledBlocksCount: number;
  readonly residentLoadedCount: number;
  readonly assembledText: string;
  readonly blockReferences: readonly LongContextIndexEntry[];
  readonly contextHash: string;
  readonly isTruncated: boolean;
  readonly tenantId: string;
  readonly executionTimeMs: number;
}

/**
 * Telemetry and resource metrics for the load-on-demand cache and index.
 */
export interface LongContextMetrics {
  readonly profileId: LongContextProfileId;
  readonly totalIndexedBlocks: number;
  readonly totalIndexedTokens: number;
  readonly residentBlocksCount: number;
  readonly residentBytes: number;
  readonly cacheHits: number;
  readonly cacheMisses: number;
  readonly evictionsCount: number;
  readonly maxResidentBytesLimit: number;
  readonly isWithinBudget: boolean;
}

/**
 * Snapshot payload for .3dmemory streaming checkpoint export/restore.
 */
export interface LongContextSnapshot {
  readonly snapshotId: string;
  readonly format: '.3dmemory';
  readonly version: number;
  readonly tenantId: string;
  readonly activeProfile: LongContextProfileId;
  readonly indexedBlocks: readonly LongContextIndexEntry[];
  readonly totalTokens: number;
  readonly snapshotChecksum: string;
  readonly isActuationBlocked: boolean;
  readonly timestamp: string;
}

/**
 * Prohibited foreign attention and distributed context libraries.
 */
export const PROHIBITED_FOREIGN_LONG_CONTEXT_FRAMEWORKS: readonly string[] = Object.freeze([
  'flashattention',
  'flash-attn',
  'flash_attn',
  'vllm',
  'xformers',
  'deepspeed',
  'megatron',
  'triton',
  'tensorrt-llm',
  'fastertransformer',
  'ring-attention',
  'ring_attention',
]);

// =============================================================================
// DOMAIN ERROR HIERARCHY
// =============================================================================

export class LongContextError extends Error {
  public readonly code: string;
  public readonly timestamp: number;

  constructor(message: string, code = 'LONG_CONTEXT_ERROR') {
    super(`[LongContext] ${message}`);
    this.name = 'LongContextError';
    this.code = code;
    this.timestamp = Date.now();
  }
}

export class LongContextProfileError extends LongContextError {
  constructor(message: string) {
    super(message, 'LONG_CONTEXT_PROFILE_ERROR');
    this.name = 'LongContextProfileError';
  }
}

export class LongContextResourceExceededError extends LongContextError {
  public readonly resourceType: string;
  public readonly currentValue: number;
  public readonly limitValue: number;

  constructor(resourceType: string, currentValue: number, limitValue: number) {
    super(
      `Resource limit exceeded for ${resourceType}: ${currentValue.toLocaleString()} > limit ${limitValue.toLocaleString()}`,
      'LONG_CONTEXT_RESOURCE_EXCEEDED'
    );
    this.name = 'LongContextResourceExceededError';
    this.resourceType = resourceType;
    this.currentValue = currentValue;
    this.limitValue = limitValue;
  }
}

export class LongContextTenantViolationError extends LongContextError {
  public readonly requestedTenant: string;
  public readonly actualTenant: string;

  constructor(requestedTenant: string, actualTenant: string) {
    super(
      `Tenant isolation violation: requested "${requestedTenant}", but resource belongs to "${actualTenant}".`,
      'LONG_CONTEXT_TENANT_VIOLATION'
    );
    this.name = 'LongContextTenantViolationError';
    this.requestedTenant = requestedTenant;
    this.actualTenant = actualTenant;
  }
}

export class LongContextOCCConflictError extends LongContextError {
  public readonly objectId: string;
  public readonly expectedVersion: number;
  public readonly actualVersion: number;

  constructor(objectId: string, expectedVersion: number, actualVersion: number) {
    super(
      `OCC state mutation conflict for "${objectId}": expected version ${expectedVersion}, but actual version is ${actualVersion}.`,
      'LONG_CONTEXT_OCC_CONFLICT'
    );
    this.name = 'LongContextOCCConflictError';
    this.objectId = objectId;
    this.expectedVersion = expectedVersion;
    this.actualVersion = actualVersion;
  }
}

export class LongContextActuationBlockedError extends LongContextError {
  constructor(directive?: string) {
    super(
      `Hardware actuation attempt blocked fail-closed: "${directive ?? 'ACTUATION_DIRECTIVE'}". IS_ACTUATION_BLOCKED=true permanently.`,
      'LONG_CONTEXT_ACTUATION_BLOCKED'
    );
    this.name = 'LongContextActuationBlockedError';
  }
}

export class LongContextForeignFrameworkError extends LongContextError {
  constructor(framework: string) {
    super(
      `Prohibited foreign long-context framework detected: "${framework}". Pure native TypeScript architecture required.`,
      'LONG_CONTEXT_FOREIGN_FRAMEWORK_ERROR'
    );
    this.name = 'LongContextForeignFrameworkError';
  }
}

export class LongContextIntegrityError extends LongContextError {
  constructor(message: string) {
    super(message, 'LONG_CONTEXT_INTEGRITY_ERROR');
    this.name = 'LongContextIntegrityError';
  }
}
