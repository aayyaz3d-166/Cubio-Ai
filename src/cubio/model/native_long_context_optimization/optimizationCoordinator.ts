/**
 * CUBiO AI — Task 181: Long-Context Efficiency & Resource Optimization
 * src/cubio/model/native_long_context_optimization/optimizationCoordinator.ts
 *
 * Master coordinator unifying paged context memory management, content-addressed
 * sequence reuse, resource governor protections, and empirical performance profiling.
 *
 * STRICT INVARIANTS:
 * 1. Paging and selective loading instead of loading all context into RAM.
 * 2. Deterministic cache eviction prevents uncontrolled cache growth.
 * 3. Anti-full-VDB scan protections fail-closed.
 * 4. Permanent hardware actuation lockout: IS_ACTUATION_BLOCKED === true.
 */

import { ContextReusePool } from './contextReusePool.js';
import { LongContextProfiler, ProfileWorkloadOptions } from './longContextProfiler.js';
import { PagedMemoryManager } from './pagedMemoryManager.js';
import { ResourceGovernor } from './resourceGovernor.js';
import {
  IS_ACTUATION_BLOCKED,
  PagedContextTile,
  ResourceLimitsConfig,
  ResourceMetricsReport,
  TASK_181_ID,
} from './types.js';

export class OptimizationCoordinator {
  public readonly taskId: string = TASK_181_ID;
  public readonly isActuationBlocked: boolean = IS_ACTUATION_BLOCKED;

  private readonly memoryManager: PagedMemoryManager;
  private readonly reusePool: ContextReusePool;
  private readonly governor: ResourceGovernor;
  private readonly profiler: LongContextProfiler;

  constructor(customLimits?: ResourceLimitsConfig) {
    this.governor = new ResourceGovernor(customLimits);
    const limits = this.governor.getLimits();
    this.memoryManager = new PagedMemoryManager(limits.maxCachedTiles, limits.maxHeapBytes);
    this.reusePool = new ContextReusePool(limits.maxCachedTiles * 4);
    this.profiler = new LongContextProfiler();
  }

  public getMemoryManager(): PagedMemoryManager {
    return this.memoryManager;
  }

  public getReusePool(): ContextReusePool {
    return this.reusePool;
  }

  public getGovernor(): ResourceGovernor {
    return this.governor;
  }

  public getProfiler(): LongContextProfiler {
    return this.profiler;
  }

  /**
   * Paged tile access: loads or caches a paged context tile.
   */
  public getOrStoreTile(tile: PagedContextTile, callerTenantId: string): PagedContextTile {
    this.governor.assertActuationBlocked(tile.content);
    this.governor.assertTenantIntegrity(callerTenantId, tile.tenantId);

    const existing = this.memoryManager.getTile(tile.tileId, callerTenantId);
    if (existing) {
      return existing;
    }

    this.memoryManager.storeTile(tile);
    return tile;
  }

  /**
   * Tokenize content with reuse caching.
   */
  public tokenizeWithReuse(content: string, tenantId: string): readonly string[] {
    this.governor.assertActuationBlocked(content);
    const contentHash = this.reusePool.registerSequence(
      content,
      tenantId,
      content.toLowerCase().split(/\s+/).filter((t) => t.length > 0)
    );
    const tokens = this.reusePool.getSequence(contentHash, tenantId);
    return tokens ?? [];
  }

  /**
   * Empirically profile a long-context workload.
   */
  public profileWorkload(options: ProfileWorkloadOptions): ResourceMetricsReport {
    this.governor.assertActuationBlocked();
    return this.profiler.profileWorkload(options);
  }
}
