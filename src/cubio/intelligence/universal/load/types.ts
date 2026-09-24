/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F72: Production Load & Performance Types & Contracts
 *
 * Covers 10 Load Vectors and 6 Measured KPIs:
 * Latency (P50/P95/P99), Throughput (RPS), Error Rate, Resource Usage, Queue Depth, Recovery Time.
 */

export type LoadTestScenario =
  | 'CONCURRENT_USERS'
  | 'LONG_CONVERSATION'
  | 'LARGE_FILES'
  | 'MULTIMODAL'
  | 'PARALLEL_AGENTS'
  | 'LONG_WORKFLOW'
  | 'PROVIDER_LATENCY'
  | 'MEMORY_PRESSURE'
  | 'THROUGHPUT_PEAK'
  | 'CHAOS_FAILURE_RECOVERY';

export interface LoadBenchmarkMetrics {
  readonly scenario: LoadTestScenario;
  readonly totalRequests: number;
  readonly successfulRequests: number;
  readonly failedRequests: number;
  readonly errorRate: number; // 0.0 to 1.0
  readonly minLatencyMs: number;
  readonly p50LatencyMs: number;
  readonly p95LatencyMs: number;
  readonly p99LatencyMs: number;
  readonly maxLatencyMs: number;
  readonly throughputRps: number;
  readonly memoryDeltaMb: number;
  readonly peakQueueDepth: number;
  readonly recoveryTimeMs: number;
  readonly durationMs: number;
}

export interface LoadTestConfig {
  readonly concurrency: number;
  readonly totalIterations: number;
  readonly payloadSizeKb?: number;
  readonly simulateJitterMs?: number;
  readonly injectChaosFault?: boolean;
  readonly conversationTurns?: number;
}

export interface ILoadBenchmarkHarness {
  runScenario(
    scenario: LoadTestScenario,
    config?: Partial<LoadTestConfig>
  ): Promise<Readonly<LoadBenchmarkMetrics>>;
  runFullSuite(): Promise<Readonly<Record<LoadTestScenario, LoadBenchmarkMetrics>>>;
}
