/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F100: Layer 6 Intelligence Evolution & Benchmark Types
 *
 * Core contracts for the Universal Intelligence Benchmark (1,000+ Tasks),
 * Domain Scoring, Evaluation Oracles, and the CubiO Intelligence Index (CII).
 */

export type BenchmarkDomain =
  | 'MATHEMATICAL_HARMONIC_GEOMETRY'
  | 'SPATIAL_3D_TOPOLOGY'
  | 'TYPESCRIPT_AST_CODE_SYNTHESIS'
  | 'VISION_GEMSTONE_OPTICS'
  | 'MULTILINGUAL_VOICE_PROCESSING'
  | 'UNIVERSAL_TOOL_EXECUTION'
  | 'MULTI_AGENT_SWARM_SOLVING'
  | 'LONG_HORIZON_STATE_CONTINUITY'
  | 'RED_TEAM_SECURITY_GOVERNANCE'
  | 'SELF_HEALING_CHAOS_RECOVERY';

export type TaskDifficulty = 'STANDARD' | 'ADVANCED' | 'FRONTIER_HARD';

export interface BenchmarkTask {
  readonly taskId: string;
  readonly domain: BenchmarkDomain;
  readonly title: string;
  readonly difficulty: TaskDifficulty;
  readonly inputPayload: Readonly<Record<string, unknown>>;
  readonly expectedOracle: (output: unknown) => { readonly valid: boolean; readonly reason?: string };
  readonly timeoutMs: number;
}

export interface BenchmarkTaskResult {
  readonly taskId: string;
  readonly domain: BenchmarkDomain;
  readonly success: boolean;
  readonly executionTimeMs: number;
  readonly output: unknown;
  readonly error?: string;
  readonly taskChecksum: string;
}

export interface DomainScoreReport {
  readonly domain: BenchmarkDomain;
  readonly totalTasks: number;
  readonly passedTasks: number;
  readonly failedTasks: number;
  readonly accuracyPercent: number;
  readonly avgLatencyMs: number;
  readonly p95LatencyMs: number;
  readonly domainScore: number; // 0 .. 100
}

export interface UniversalBenchmarkSummary {
  readonly benchmarkRunId: string;
  readonly totalTasksEvaluated: number;
  readonly overallPassedCount: number;
  readonly overallFailedCount: number;
  readonly overallAccuracyPercent: number;
  readonly totalDurationSeconds: number;
  readonly throughputRps: number;
  readonly domainReports: readonly DomainScoreReport[];
  readonly cubioIntelligenceIndex: number; // 0 .. 1000 composite metric
  readonly benchmarkChecksum: string;
  readonly timestamp: number;
}

export interface IUniversalBenchmarkEngine {
  generateStandardizedTasks(countPerDomain?: number): readonly BenchmarkTask[];
  executeBenchmark(tasks?: readonly BenchmarkTask[], concurrency?: number): Promise<UniversalBenchmarkSummary>;
}
