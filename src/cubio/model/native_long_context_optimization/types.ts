/**
 * CUBiO AI — Task 181: Long-Context Efficiency & Resource Optimization
 * src/cubio/model/native_long_context_optimization/types.ts
 *
 * Universal contracts, resource configuration limits, paged tile interfaces,
 * and domain errors for native long-context efficiency and optimization.
 *
 * STRICT INVARIANTS:
 * 1. Zero foreign libraries (no LangChain, LlamaIndex, ChromaDB, PyTorch).
 * 2. Optimize only newly introduced Phase 12 long-context components.
 * 3. Never modify or optimize frozen Phase 1–11 baseline code.
 * 4. Hard ceilings on memory, heap, tiles, and tokens; fail-closed on limits.
 * 5. Deterministic output and identical provenance under optimization.
 * 6. Permanent hardware actuation lockout: IS_ACTUATION_BLOCKED === true.
 */

export const TASK_181_ID = 'CUBIO-TASK-181-LONG-CONTEXT-EFFICIENCY-RESOURCE-OPTIMIZATION';
export const IS_ACTUATION_BLOCKED = true;

export const DEFAULT_MAX_CACHED_TILES = 64;
export const DEFAULT_MAX_HEAP_BYTES = 67_108_864; // 64 MB
export const DEFAULT_MAX_WORKING_TOKENS = 32_768;
export const DEFAULT_MAX_LATENCY_MS = 250;

/**
 * Paged context tile stored in memory manager.
 */
export interface PagedContextTile {
  readonly tileId: string;
  readonly tenantId: string;
  readonly startToken: number;
  readonly endToken: number;
  readonly tokenCount: number;
  readonly checksum: string;               // SHA-256 canonical checksum
  readonly lastAccessedAt: number;         // Timestamp for LRU
  readonly accessCount: number;            // Frequency for LFU
  readonly byteSize: number;
  readonly content: string;
}

/**
 * Resource limits and optimization configuration.
 */
export interface ResourceLimitsConfig {
  readonly maxHeapBytes?: number;
  readonly maxCachedTiles?: number;
  readonly maxWorkingTokens?: number;
  readonly maxLatencyMs?: number;
}

/**
 * Comprehensive empirical report of resource usage and throughput.
 */
export interface ResourceMetricsReport {
  readonly tenantId: string;
  readonly peakHeapBytes: number;
  readonly allocatedTileCount: number;
  readonly cacheHitRatio: number;
  readonly throughputTokensPerSec: number;
  readonly meanLatencyMs: number;
  readonly totalQueriesEvaluated: number;
  readonly isDeterministic: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Domain Errors
// ─────────────────────────────────────────────────────────────────────────────

export class ResourceOptimizationError extends Error {
  public readonly code: string;

  constructor(message: string, code: string) {
    super(`[LongContextOptimization] ${message}`);
    this.name = 'ResourceOptimizationError';
    this.code = code;
  }
}

export class ResourceLimitExceededError extends ResourceOptimizationError {
  public readonly currentUsage: number;
  public readonly limit: number;
  public readonly resourceName: string;

  constructor(currentUsage: number, limit: number, resourceName: string) {
    super(
      `Resource limit exceeded: requested ${currentUsage} ${resourceName} exceeds hard ceiling ${limit}. Execution halted fail-closed.`,
      'RESOURCE_LIMIT_EXCEEDED'
    );
    this.name = 'ResourceLimitExceededError';
    this.currentUsage = currentUsage;
    this.limit = limit;
    this.resourceName = resourceName;
  }
}

export class UncontrolledCacheGrowthError extends ResourceOptimizationError {
  public readonly tileCount: number;
  public readonly maxTiles: number;

  constructor(tileCount: number, maxTiles: number) {
    super(
      `Uncontrolled cache growth detected: cached tiles ${tileCount} exceeds maximum allowance ${maxTiles}. Cache eviction halted fail-closed.`,
      'UNCONTROLLED_CACHE_GROWTH'
    );
    this.name = 'UncontrolledCacheGrowthError';
    this.tileCount = tileCount;
    this.maxTiles = maxTiles;
  }
}

export class FullVdbLoadingBlockedError extends ResourceOptimizationError {
  public readonly queryPattern: string;

  constructor(queryPattern: string) {
    super(
      `Full-VDB memory scan blocked: Query pattern "${queryPattern}" attempted unbounded scan. Context must be retrieved via selective paging.`,
      'FULL_VDB_LOADING_BLOCKED'
    );
    this.name = 'FullVdbLoadingBlockedError';
    this.queryPattern = queryPattern;
  }
}

export class OptimizationActuationBlockedError extends ResourceOptimizationError {
  public readonly directive: string;

  constructor(directive: string) {
    super(
      `Hardware Actuation Blocked: Resource optimization layer rejected directive "${directive}". Physical actuation permanently prohibited.`,
      'HARDWARE_ACTUATION_PROHIBITED'
    );
    this.name = 'OptimizationActuationBlockedError';
    this.directive = directive;
  }
}

export class OptimizationTenantViolationError extends ResourceOptimizationError {
  public readonly callerTenant: string;
  public readonly targetTenant: string;

  constructor(callerTenant: string, targetTenant: string) {
    super(
      `Tenant Isolation Violation: Caller tenant "${callerTenant}" attempted access to resource owned by "${targetTenant}". Access blocked fail-closed.`,
      'OPTIMIZATION_TENANT_VIOLATION'
    );
    this.name = 'OptimizationTenantViolationError';
    this.callerTenant = callerTenant;
    this.targetTenant = targetTenant;
  }
}
