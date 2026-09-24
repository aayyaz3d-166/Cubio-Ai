/**
 * CUBiO AI — Phase 6: Task 90 — Native Language Intelligence Optimization
 * src/cubio/language/native/optimization/languageOptimizationTypes.ts
 *
 * Formal contracts, workload types, telemetry interfaces, and benchmarking schemas
 * for sovereign native language intelligence runtime optimization.
 */

export type LanguageWorkloadType =
  | 'TOKEN_PROCESSING'
  | 'MEMORY_RETRIEVAL'
  | 'REASONING_EVALUATION'
  | 'GENERATION_SYNTHESIS'
  | 'SPATIAL_LANGUAGE'
  | 'MULTILINGUAL_TRANSFER'
  | 'MULTIMODAL_QA'
  | 'LONG_CONTEXT_NEEDLE';

export type LanguageEvictionPolicy = 'LRU' | 'FIFO' | 'TIME_AWARE_LRU';

export interface LanguageLatencyPercentiles {
  readonly p50Ms: number;
  readonly p95Ms: number;
  readonly p99Ms: number;
  readonly maxMs: number;
  readonly meanMs: number;
}

export interface LanguageWorkloadMetrics {
  readonly workloadType: LanguageWorkloadType;
  readonly phase: 'BASELINE' | 'OPTIMIZED';
  readonly isColdStart: boolean;
  readonly iterations: number;
  readonly totalDurationMs: number;
  readonly throughputOpsPerSec: number;
  readonly latencies: LanguageLatencyPercentiles;
  readonly initialHeapBytes: number;
  readonly finalHeapBytes: number;
  readonly heapDeltaBytes: number;
  readonly cacheHits: number;
  readonly cacheMisses: number;
  readonly evictionCount: number;
  readonly sampleResultChecksum: string;
}

export interface LanguageWorkloadComparison {
  readonly workloadType: LanguageWorkloadType;
  readonly baseline: LanguageWorkloadMetrics;
  readonly optimized: LanguageWorkloadMetrics;
  readonly speedupFactor: number;
  readonly throughputDeltaPct: number;
  readonly memoryDeltaPct: number;
  readonly isCorrectnessPreserved: boolean;
  readonly resultsChecksumMatched: boolean;
}

export interface BoundedLanguageCacheConfig {
  readonly maxCapacity: number;
  readonly maxBytesBudget?: number;
  readonly evictionPolicy: LanguageEvictionPolicy;
  readonly ttlMs?: number;
}

export interface BoundedLanguageCacheStats {
  readonly size: number;
  readonly maxCapacity: number;
  readonly approximateBytes: number;
  readonly maxBytesBudget?: number;
  readonly hits: number;
  readonly misses: number;
  readonly hitRatio: number;
  readonly evictionCount: number;
  readonly tenantCounts: Readonly<Record<string, number>>;
}

export interface LanguageBottleneckRecord {
  readonly subsystem: string;
  readonly bottleneckType: 'CPU_ALGORITHMIC' | 'MEMORY_ALLOCATION' | 'SERIALIZATION' | 'DATA_ACCESS';
  readonly description: string;
  readonly preOptimizationSymptom: string;
  readonly appliedRemediation: string;
  readonly verifiedGain: string;
}

export interface LanguageOptimizationSummary {
  readonly timestamp: number;
  readonly baselineMetrics: readonly LanguageWorkloadMetrics[];
  readonly optimizedMetrics: readonly LanguageWorkloadMetrics[];
  readonly comparisons: readonly LanguageWorkloadComparison[];
  readonly bottlenecks: readonly LanguageBottleneckRecord[];
  readonly overallSpeedupFactor: number;
  readonly allCorrectnessPreserved: boolean;
  readonly dbBaselineUntouched: boolean;
}

export interface LanguageCheckpointState {
  readonly version: number;
  readonly timestamp: number;
  readonly tenantId: string;
  readonly tokenTrieSize: number;
  readonly cacheEntries: number;
  readonly cacheStats: BoundedLanguageCacheStats;
  readonly checksum: string;
}

export class LanguageOptimizationError extends Error {
  public constructor(message: string) {
    super(`[LANGUAGE_OPTIMIZATION_ERROR] ${message}`);
    this.name = 'LanguageOptimizationError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class LanguageCacheBudgetExceededError extends Error {
  public constructor(message: string) {
    super(`[LANGUAGE_CACHE_BUDGET_EXCEEDED] ${message}`);
    this.name = 'LanguageCacheBudgetExceededError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
