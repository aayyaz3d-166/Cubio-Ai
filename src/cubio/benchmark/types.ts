/**
 * CubiO — Universal Spatial Operating Environment
 * Phase 14: Scale & Benchmark Engine Types
 *
 * Real Concurrency & Volume Scale Measurement:
 * 1 User -> 10 -> 100 -> 1,000 -> 10,000 -> 100,000 -> 1,000,000 / day.
 *
 * 10 Measured Axes:
 * RAM, CPU, GPU, Bandwidth, Latency, DB Reads, Storage, Cache Hit Rate, Concurrent Sessions, AI Cost.
 */

export type ScaleTierName =
  | '1_USER'
  | '10_USERS'
  | '100_USERS'
  | '1000_USERS'
  | '10000_USERS'
  | '100000_USERS'
  | '1M_PER_DAY';

export interface ScaleBenchmarkMetricReport {
  readonly tier: ScaleTierName;
  readonly targetUsersCount: number;
  readonly actualConcurrentSessions: number;
  
  // 1. RAM Utilization
  readonly clientRamPerUserMb: number;
  readonly serverRamTotalMb: number;
  
  // 2. CPU & Throughput
  readonly totalExecutionDurationMs: number;
  readonly throughputOpsPerSec: number;
  
  // 3. GPU Compute
  readonly gpuViewportFps: number;
  readonly gpuShaderLoadPercent: number;
  
  // 4. Bandwidth
  readonly totalBandwidthBytes: number;
  readonly avgBandwidthPerUserBytesSec: number;
  
  // 5. Latency & Percentiles
  readonly avgLatencyMs: number;
  readonly p50LatencyMs: number;
  readonly p90LatencyMs: number;
  readonly p99LatencyMs: number;
  
  // 6. Database Reads & Writes
  readonly dbReadsCount: number;
  readonly dbWritesCount: number;
  
  // 7. Storage (CAS)
  readonly storageTotalMb: number;
  readonly storageChunksCount: number;
  
  // 8. Cache Performance
  readonly cacheHitRatioPercent: number;
  readonly cacheMissesCount: number;
  
  // 9. State Invariant & Convergence
  readonly isConverged: boolean;
  readonly convergenceChecksum: string;
  
  // 10. AI Cost Modeling
  readonly aiInferenceCostUsd: number;
  readonly serverOffloadRatioPercent: number;
}

export interface ScaleBenchmarkSuiteResult {
  readonly timestamp: number;
  readonly totalTiersTested: number;
  readonly totalSimulatedOperations: number;
  readonly reports: readonly ScaleBenchmarkMetricReport[];
  readonly scalingEfficiencyRatio: number; // Linear scaling factor [0..1]
  readonly target1MDailyFeasibility: boolean;
  readonly suiteChecksum: string;
}
