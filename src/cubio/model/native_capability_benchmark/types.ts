/**
 * CUBiO AI — Task 169: Native Model Benchmark & Capability Evaluation
 * src/cubio/model/native_capability_benchmark/types.ts
 *
 * Universal type contracts, evaluation dimensions, safety stress categories,
 * empirical-vs-theoretical metric structures, and domain errors.
 *
 * STRICT INVARIANTS:
 * 1. Zero foreign ML frameworks (no PyTorch, HuggingFace, DeepSpeed, Megatron, JAX, etc.).
 * 2. Pure native TypeScript deterministic evaluation with zero external weights.
 * 3. 5-Dimension Capability Suite: Understanding, Generation, Memory Retrieval, Reasoning, Instruction Following.
 * 4. 4-Tier Safety Stress Suite: Hallucination, Contradiction, Provenance, Epistemic Refusal.
 * 5. Strict separation of empirical measured capability from theoretical parameter estimates.
 * 6. Primary VDB provenance authority with streaming .3dmemory checkpoint transport.
 * 7. Permanent hardware actuation lockout: IS_ACTUATION_BLOCKED === true.
 */

export const TASK_169_ID = 'CUBIO-TASK-169-NATIVE-MODEL-BENCHMARK-CAPABILITY';
export const IS_ACTUATION_BLOCKED = true;

/**
 * Prohibited foreign ML frameworks and cloud endpoints.
 */
export const PROHIBITED_FOREIGN_FRAMEWORKS: readonly string[] = Object.freeze([
  'pytorch',
  'torch',
  'huggingface',
  'transformers',
  'deepspeed',
  'megatron',
  'accelerate',
  'jax',
  'tensorflow',
  'cuda-cloud',
  'openai',
  'anthropic',
  'llama',
  'qwen',
]);

/**
 * 5 Core Capability Evaluation Dimensions.
 */
export enum CapabilityDimension {
  LANGUAGE_UNDERSTANDING = 'LANGUAGE_UNDERSTANDING',
  LANGUAGE_GENERATION = 'LANGUAGE_GENERATION',
  MEMORY_RETRIEVAL = 'MEMORY_RETRIEVAL',
  REASONING = 'REASONING',
  INSTRUCTION_FOLLOWING = 'INSTRUCTION_FOLLOWING',
}

export const CAPABILITY_DIMENSIONS: readonly CapabilityDimension[] = Object.freeze([
  CapabilityDimension.LANGUAGE_UNDERSTANDING,
  CapabilityDimension.LANGUAGE_GENERATION,
  CapabilityDimension.MEMORY_RETRIEVAL,
  CapabilityDimension.REASONING,
  CapabilityDimension.INSTRUCTION_FOLLOWING,
]);

/**
 * 4 Safety & Robustness Stress Categories.
 */
export enum SafetyStressCategory {
  HALLUCINATION = 'HALLUCINATION',
  CONTRADICTION = 'CONTRADICTION',
  PROVENANCE = 'PROVENANCE',
  EPISTEMIC_REFUSAL = 'EPISTEMIC_REFUSAL',
}

export const SAFETY_STRESS_CATEGORIES: readonly SafetyStressCategory[] = Object.freeze([
  SafetyStressCategory.HALLUCINATION,
  SafetyStressCategory.CONTRADICTION,
  SafetyStressCategory.PROVENANCE,
  SafetyStressCategory.EPISTEMIC_REFUSAL,
]);

/**
 * Standardized Benchmark Task Specification.
 */
export interface BenchmarkTaskSpec {
  readonly id: string;
  readonly dimension: CapabilityDimension;
  readonly name: string;
  readonly prompt: string;
  readonly expectedTokenOrPrefix: string;
  readonly domain: string;
  readonly spatialCellId?: number;
  readonly expectedEpistemicStatus?: string;
  readonly description?: string;
}

/**
 * Safety Stress Test Specification.
 */
export interface SafetyStressSpec {
  readonly id: string;
  readonly category: SafetyStressCategory;
  readonly name: string;
  readonly prompt: string;
  readonly unverifiedAssertion?: string;
  readonly contradictoryPremises?: readonly [string, string];
  readonly expectedRefusal: boolean;
  readonly expectedEpistemicStatus?: string;
  readonly requiredAction: 'REFUSE_ASSERTION' | 'RESOLVE_CONFLICT' | 'ASSERT_PROVENANCE' | 'REJECT_HALLUCINATION';
}

/**
 * Per-Dimension Benchmark Evaluation Result.
 */
export interface DimensionBenchmarkResult {
  readonly dimension: CapabilityDimension;
  readonly taskCount: number;
  readonly passedTasks: number;
  readonly accuracy: number;
  readonly averageLoss: number;
  readonly averageLatencyMs: number;
}

/**
 * Per-Category Safety Stress Result.
 */
export interface SafetyStressResult {
  readonly category: SafetyStressCategory;
  readonly testCount: number;
  readonly passedTests: number;
  readonly passRate: number;
  readonly details: readonly { id: string; name: string; passed: boolean; reason: string }[];
}

/**
 * Explicit Separation: Theoretical Assumptions vs Empirical Measurements.
 */
export interface TheoreticalVsMeasuredMetrics {
  readonly theoreticalParameters: number;
  readonly theoreticalTensors: number;
  readonly theoreticalFLOPsPerToken: number;
  readonly measuredAccuracy: number;
  readonly measuredLoss: number;
  readonly measuredLatencyMs: number;
  readonly measuredPeakHeapMB: number;
  readonly empiricalObservation: string;
}

/**
 * Comprehensive Benchmark Results for an individual Model Scale.
 */
export interface ScaleCapabilityBenchmarkResult {
  readonly profileId: string;
  readonly modelName: string;
  readonly parameterCount: number;
  readonly dimensionResults: Readonly<Record<CapabilityDimension, DimensionBenchmarkResult>>;
  readonly safetyResults: Readonly<Record<SafetyStressCategory, SafetyStressResult>>;
  readonly aggregateCapabilityScore: number;
  readonly aggregateSafetyScore: number;
  readonly consistencyScore: number;
  readonly averageLatencyMs: number;
  readonly peakHeapBytes: number;
  readonly failureModes: readonly string[];
  readonly theoreticalVsMeasured: TheoreticalVsMeasuredMetrics;
  readonly benchmarkDigest: string;
}

/**
 * Authoritative Phase 11 Capability Benchmark Report.
 */
export interface Phase11BenchmarkReport {
  readonly reportId: string;
  readonly timestamp: number;
  readonly evaluatedScales: Readonly<Record<string, ScaleCapabilityBenchmarkResult>>;
  readonly scalingSummary: {
    readonly capabilityVsScale: Readonly<Record<string, number>>;
    readonly safetyVsScale: Readonly<Record<string, number>>;
    readonly latencyVsScale: Readonly<Record<string, number>>;
    readonly optimalScaleByEfficiency: string;
  };
  readonly vdbSynced: boolean;
  readonly isActuationBlocked: boolean;
}

// =============================================================================
// DOMAIN ERRORS
// =============================================================================

export class CapabilityBenchmarkError extends Error {
  public readonly code: string;
  public readonly timestamp: number;

  constructor(message: string, code = 'CAPABILITY_BENCHMARK_ERROR') {
    super(`[CapabilityBenchmark] ${message}`);
    this.name = 'CapabilityBenchmarkError';
    this.code = code;
    this.timestamp = Date.now();
  }
}

export class BenchmarkSafetyViolationError extends CapabilityBenchmarkError {
  public readonly testId: string;
  public readonly violation: string;

  constructor(testId: string, violation: string) {
    super(
      `Safety stress test failure on ${testId}: ${violation}. Aborting fail-closed.`,
      'BENCHMARK_SAFETY_VIOLATION'
    );
    this.name = 'BenchmarkSafetyViolationError';
    this.testId = testId;
    this.violation = violation;
  }
}

export class BenchmarkActuationBlockedError extends CapabilityBenchmarkError {
  public readonly directive: string;

  constructor(directive: string) {
    super(
      `Permanent Hardware Actuation Blocked: Capability benchmark intercepted directive "${directive}" fail-closed.`,
      'HARDWARE_ACTUATION_PROHIBITED'
    );
    this.name = 'BenchmarkActuationBlockedError';
    this.directive = directive;
  }
}

export class BenchmarkForeignFrameworkError extends CapabilityBenchmarkError {
  public readonly foreignFramework: string;

  constructor(foreignFramework: string) {
    super(
      `Prohibited foreign ML framework detected: "${foreignFramework}". Pure sovereign CUBiO architecture required.`,
      'FOREIGN_FRAMEWORK_PROHIBITED'
    );
    this.name = 'BenchmarkForeignFrameworkError';
    this.foreignFramework = foreignFramework;
  }
}
