/**
 * CUBiO AI — Phase 5: Task 71 — Intelligence Runtime Optimization
 * src/cubio/intelligence/optimization/optimizationTypes.ts
 *
 * Formal contracts, telemetry interfaces, and benchmarking schemas
 * for native intelligence runtime optimization.
 */

export type WorkloadType = 'LEARNING' | 'RETRIEVAL' | 'REASONING' | 'INFERENCE';

export type EvictionPolicy = 'LRU' | 'FIFO' | 'TIME_AWARE_LRU';

export interface LatencyPercentiles {
  readonly p50Ms: number;
  readonly p95Ms: number;
  readonly p99Ms: number;
  readonly maxMs: number;
  readonly meanMs: number;
}

export interface WorkloadProfileMetrics {
  readonly workloadType: WorkloadType;
  readonly phase: 'BASELINE' | 'OPTIMIZED';
  readonly isColdStart: boolean;
  readonly iterations: number;
  readonly totalDurationMs: number;
  readonly throughputOpsPerSec: number;
  readonly latencies: LatencyPercentiles;
  readonly initialHeapBytes: number;
  readonly finalHeapBytes: number;
  readonly heapDeltaBytes: number;
  readonly cacheHits?: number;
  readonly cacheMisses?: number;
  readonly evictionCount?: number;
  readonly sampleResultChecksum: string;
}

export interface WorkloadComparison {
  readonly workloadType: WorkloadType;
  readonly baseline: WorkloadProfileMetrics;
  readonly optimized: WorkloadProfileMetrics;
  readonly speedupFactor: number;
  readonly throughputDeltaPct: number;
  readonly memoryDeltaPct: number;
  readonly isCorrectnessPreserved: boolean;
  readonly resultsChecksumMatched: boolean;
}

export interface BoundedCacheConfig {
  readonly maxCapacity: number;
  readonly evictionPolicy: EvictionPolicy;
  readonly ttlMs?: number;
}

export interface BoundedCacheStats {
  readonly size: number;
  readonly maxCapacity: number;
  readonly hits: number;
  readonly misses: number;
  readonly hitRatio: number;
  readonly evictionCount: number;
  readonly tenantCounts: Readonly<Record<string, number>>;
}

export interface BottleneckRecord {
  readonly subsystem: string;
  readonly bottleneckType: 'CPU_ALGORITHMIC' | 'MEMORY_ALLOCATION' | 'SERIALIZATION' | 'DATA_ACCESS';
  readonly description: string;
  readonly preOptimizationSymptom: string;
  readonly appliedRemediation: string;
  readonly verifiedGain: string;
}

export interface RuntimeOptimizationSummary {
  readonly timestamp: number;
  readonly baselineMetrics: readonly WorkloadProfileMetrics[];
  readonly optimizedMetrics: readonly WorkloadProfileMetrics[];
  readonly comparisons: readonly WorkloadComparison[];
  readonly bottlenecks: readonly BottleneckRecord[];
  readonly overallSpeedupFactor: number;
  readonly allCorrectnessPreserved: boolean;
  readonly dbBaselineUntouched: boolean;
}

export class RuntimeOptimizationError extends Error {
  public constructor(message: string) {
    super(`[RUNTIME_OPTIMIZATION_ERROR] ${message}`);
    this.name = 'RuntimeOptimizationError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class CacheBudgetExceededError extends Error {
  public constructor(message: string) {
    super(`[CACHE_BUDGET_EXCEEDED] ${message}`);
    this.name = 'CacheBudgetExceededError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
