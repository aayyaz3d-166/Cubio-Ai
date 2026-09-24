/**
 * CUBiO AI — Task 182: Long-Context Benchmark & Stability
 * src/cubio/model/native_long_context_benchmark/types.ts
 *
 * Universal contracts, profile configurations, benchmark report structures,
 * and domain error classes for Phase 12 long-context capability evaluation.
 *
 * STRICT INVARIANTS:
 * 1. Zero foreign ML frameworks (no PyTorch, HuggingFace, DeepSpeed, Megatron, JAX).
 * 2. Complete evaluation across all 7 profiles: 1K, 4K, 16K, 32K, 128K, 256K, 1M.
 * 3. End-to-end integration: chunking, compression, retrieval, ranking, references, reasoning, consolidation.
 * 4. 4-tier adversarial stress: corruption, contradiction, tenant isolation, resource exhaustion.
 * 5. Deterministic A=B=C bitwise reproducibility: delta = 0.
 * 6. Permanent hardware actuation lockout: IS_ACTUATION_BLOCKED === true.
 */

export const TASK_182_ID = 'CUBIO-TASK-182-LONG-CONTEXT-BENCHMARK-STABILITY';
export const IS_ACTUATION_BLOCKED = true;

export type ContextProfile =
  | '1K'
  | '4K'
  | '16K'
  | '32K'
  | '128K'
  | '256K'
  | '1M';

export const CONTEXT_PROFILES: readonly ContextProfile[] = Object.freeze([
  '1K',
  '4K',
  '16K',
  '32K',
  '128K',
  '256K',
  '1M',
]);

export interface ProfileSpec {
  readonly profile: ContextProfile;
  readonly tokenCapacity: number;
  readonly activeWindowBudget: number;
  readonly maxWorkingTiles: number;
  readonly maxLatencyCeilingMs: number;
}

export const PROFILE_CONFIGS: Readonly<Record<ContextProfile, ProfileSpec>> = Object.freeze({
  '1K': { profile: '1K', tokenCapacity: 1024, activeWindowBudget: 1024, maxWorkingTiles: 4, maxLatencyCeilingMs: 100 },
  '4K': { profile: '4K', tokenCapacity: 4096, activeWindowBudget: 2048, maxWorkingTiles: 8, maxLatencyCeilingMs: 150 },
  '16K': { profile: '16K', tokenCapacity: 16384, activeWindowBudget: 4096, maxWorkingTiles: 16, maxLatencyCeilingMs: 250 },
  '32K': { profile: '32K', tokenCapacity: 32768, activeWindowBudget: 8192, maxWorkingTiles: 32, maxLatencyCeilingMs: 400 },
  '128K': { profile: '128K', tokenCapacity: 131072, activeWindowBudget: 16384, maxWorkingTiles: 64, maxLatencyCeilingMs: 800 },
  '256K': { profile: '256K', tokenCapacity: 262144, activeWindowBudget: 32768, maxWorkingTiles: 128, maxLatencyCeilingMs: 1500 },
  '1M': { profile: '1M', tokenCapacity: 1048576, activeWindowBudget: 65536, maxWorkingTiles: 256, maxLatencyCeilingMs: 3000 },
});

export interface ProfileBenchmarkResult {
  readonly profile: ContextProfile;
  readonly tokenCapacity: number;
  readonly activeWindowTokens: number;
  readonly latencyMs: number;
  readonly memoryBytes: number;
  readonly retrievalAccuracy: number;      // [0, 1] Target recall rate
  readonly referenceResolutionRate: number;// [0, 1] Cross-window resolution success
  readonly reasoningConsistency: number;  // [0, 1] Valid formal proofs
  readonly passed: boolean;
}

export interface ColdWarmComparison {
  readonly coldLatencyMs: number;
  readonly warmLatencyMs: number;
  readonly speedupMultiplier: number;
  readonly memoryDeltaBytes: number;
}

export interface IntegratedE2EResult {
  readonly streamTokensIngested: number;
  readonly chunksGenerated: number;
  readonly compressedSummaryTokens: number;
  readonly vdbRecordsPersisted: number;
  readonly topKRankedCandidates: number;
  readonly referencesResolved: number;
  readonly reasoningConclusionStatus: string;
  readonly consolidationDuplicatesPruned: number;
  readonly e2eDigest: string;               // SHA-256 cryptographic proof
  readonly latencyMs: number;
  readonly passed: boolean;
}

export interface AdversarialStressReport {
  readonly corruptionDetectionBlocked: boolean;
  readonly contradictionInterceptionBlocked: boolean;
  readonly tenantLeakageBlocked: boolean;
  readonly resourceExhaustionBlocked: boolean;
  readonly actuationCommandBlocked: boolean;
  readonly allPassed: boolean;
}

export interface CompleteBenchmarkSuiteReport {
  readonly profileResults: readonly ProfileBenchmarkResult[];
  readonly coldWarmComparison: ColdWarmComparison;
  readonly integratedE2EResult: IntegratedE2EResult;
  readonly adversarialReport: AdversarialStressReport;
  readonly triplicateDeterminismVerified: boolean;
  readonly benchmarkDigest: string;        // SHA-256 cryptographic hash of entire audit
  readonly timestamp: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Domain Errors
// ─────────────────────────────────────────────────────────────────────────────

export class BenchmarkError extends Error {
  public readonly code: string;

  constructor(message: string, code: string) {
    super(`[LongContextBenchmark] ${message}`);
    this.name = 'BenchmarkError';
    this.code = code;
  }
}

export class BenchmarkProfileFailureError extends BenchmarkError {
  public readonly profile: ContextProfile;
  public readonly metric: string;

  constructor(profile: ContextProfile, metric: string, details: string) {
    super(
      `Benchmark failed for profile "${profile}" on metric "${metric}": ${details}. Benchmark halted fail-closed.`,
      'BENCHMARK_PROFILE_FAILURE'
    );
    this.name = 'BenchmarkProfileFailureError';
    this.profile = profile;
    this.metric = metric;
  }
}

export class BenchmarkActuationBlockedError extends BenchmarkError {
  public readonly directive: string;

  constructor(directive: string) {
    super(
      `Hardware Actuation Blocked: Benchmark layer rejected directive "${directive}". Physical actuation permanently prohibited.`,
      'HARDWARE_ACTUATION_PROHIBITED'
    );
    this.name = 'BenchmarkActuationBlockedError';
    this.directive = directive;
  }
}

export class BenchmarkTenantViolationError extends BenchmarkError {
  public readonly callerTenant: string;
  public readonly targetTenant: string;

  constructor(callerTenant: string, targetTenant: string) {
    super(
      `Tenant Isolation Violation during benchmark: Caller "${callerTenant}" attempted access to "${targetTenant}". Access blocked fail-closed.`,
      'BENCHMARK_TENANT_VIOLATION'
    );
    this.name = 'BenchmarkTenantViolationError';
    this.callerTenant = callerTenant;
    this.targetTenant = targetTenant;
  }
}
