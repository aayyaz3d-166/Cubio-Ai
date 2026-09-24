/**
 * CUBiO AI — Task 181: Long-Context Efficiency & Resource Optimization
 * src/cubio/model/native_long_context_optimization/resourceGovernor.ts
 *
 * Safety governor enforcing hardware actuation lockout, tenant isolation,
 * anti-full-VDB scan protections, and hard resource limit ceilings.
 *
 * STRICT INVARIANTS:
 * 1. Hardware Actuation Lockout: Permanent physical lockout, IS_ACTUATION_BLOCKED === true.
 * 2. Anti-Full-VDB scan: Unbounded or full-database queries blocked fail-closed.
 * 3. Hard ceilings on memory, tokens, and latency.
 */

import {
  DEFAULT_MAX_HEAP_BYTES,
  DEFAULT_MAX_WORKING_TOKENS,
  FullVdbLoadingBlockedError,
  IS_ACTUATION_BLOCKED,
  OptimizationActuationBlockedError,
  OptimizationTenantViolationError,
  ResourceLimitExceededError,
  ResourceLimitsConfig,
} from './types.js';

export class ResourceGovernor {
  private static readonly FORBIDDEN_ACTUATION_TOKENS: readonly string[] = Object.freeze([
    'ACTUATE',
    'DISPATCH_FORCE',
    'PHYSICAL_OVERRIDE',
    'ARM_MOTOR',
    'TRIGGER_RELAY',
    'HARDWARE_PULSE',
  ]);

  private static readonly FULL_SCAN_PATTERNS: readonly string[] = Object.freeze([
    'SELECT *',
    'LOAD_ALL',
    'DUMP_ALL_RECORDS',
    'UNBOUNDED_SCAN',
    'ALL_CONTEXT_IN_RAM',
  ]);

  private readonly limits: Required<ResourceLimitsConfig>;

  constructor(customLimits?: ResourceLimitsConfig) {
    this.limits = {
      maxHeapBytes: customLimits?.maxHeapBytes ?? DEFAULT_MAX_HEAP_BYTES,
      maxCachedTiles: customLimits?.maxCachedTiles ?? 64,
      maxWorkingTokens: customLimits?.maxWorkingTokens ?? DEFAULT_MAX_WORKING_TOKENS,
      maxLatencyMs: customLimits?.maxLatencyMs ?? 250,
    };
  }

  /**
   * Enforce permanent hardware actuation lockout.
   */
  public assertActuationBlocked(directive?: string): void {
    if (!IS_ACTUATION_BLOCKED) {
      throw new OptimizationActuationBlockedError(directive ?? 'UNKNOWN_DIRECTIVE');
    }

    if (directive) {
      const upper = directive.toUpperCase();
      for (const token of ResourceGovernor.FORBIDDEN_ACTUATION_TOKENS) {
        if (upper.includes(token)) {
          throw new OptimizationActuationBlockedError(directive);
        }
      }
    }
  }

  /**
   * Enforce tenant isolation between caller and target.
   */
  public assertTenantIntegrity(callerTenant: string, targetTenant: string): void {
    if (!callerTenant || !targetTenant || callerTenant !== targetTenant) {
      throw new OptimizationTenantViolationError(callerTenant, targetTenant);
    }
  }

  /**
   * Reject unbounded or full-database scan queries fail-closed.
   */
  public assertSelectiveQuery(queryPattern: string): void {
    const upper = queryPattern.toUpperCase().trim();
    for (const pattern of ResourceGovernor.FULL_SCAN_PATTERNS) {
      if (upper.includes(pattern)) {
        throw new FullVdbLoadingBlockedError(queryPattern);
      }
    }
  }

  /**
   * Validate working token count against ceiling.
   */
  public assertTokenBudget(tokens: number): void {
    if (tokens > this.limits.maxWorkingTokens) {
      throw new ResourceLimitExceededError(tokens, this.limits.maxWorkingTokens, 'tokens');
    }
  }

  /**
   * Validate heap memory usage against ceiling.
   */
  public assertHeapUsage(heapBytes: number): void {
    if (heapBytes > this.limits.maxHeapBytes) {
      throw new ResourceLimitExceededError(heapBytes, this.limits.maxHeapBytes, 'heap bytes');
    }
  }

  public getLimits(): Required<ResourceLimitsConfig> {
    return this.limits;
  }
}
