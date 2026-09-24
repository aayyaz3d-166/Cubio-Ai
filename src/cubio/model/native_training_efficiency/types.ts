/**
 * CUBiO AI — Task 166: Native Training Compute & Efficiency
 * src/cubio/model/native_training_efficiency/types.ts
 *
 * Universal type contracts, domain errors, and interface definitions
 * for native training compute optimizations, deterministic batching,
 * gradient accumulation, and bounded resource governance.
 *
 * STRICT INVARIANTS:
 * 1. Zero foreign ML/training frameworks (no PyTorch, HuggingFace, DeepSpeed, Megatron, JAX, etc.).
 * 2. Pure native TypeScript/Node deterministic compute with zero external pretrained weights.
 * 3. Bounded training memory governors failing closed upon limit violations.
 * 4. Deterministic micro-batching and gradient accumulation ($A = B = C, \Delta = 0$).
 * 5. Primary VDB provenance authority with streaming .3dmemory checkpoint transport.
 * 6. Permanent hardware actuation lockout: IS_ACTUATION_BLOCKED === true.
 */

export const TASK_166_ID = 'CUBIO-TASK-166-NATIVE-TRAINING-COMPUTE-EFFICIENCY';
export const IS_ACTUATION_BLOCKED = true;

/**
 * Prohibited foreign training frameworks and cloud APIs.
 */
export const PROHIBITED_FOREIGN_TRAINING_FRAMEWORKS: readonly string[] = Object.freeze([
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
]);

// =============================================================================
// DOMAIN ERRORS
// =============================================================================

export class TrainingEfficiencyError extends Error {
  public readonly code: string;
  public readonly timestamp: number;

  constructor(message: string, code = 'TRAINING_EFFICIENCY_ERROR') {
    super(`[TrainingEfficiency] ${message}`);
    this.name = 'TrainingEfficiencyError';
    this.code = code;
    this.timestamp = Date.now();
  }
}

export class TrainingResourceExceededError extends TrainingEfficiencyError {
  public readonly resourceType: 'HEAP_MEMORY' | 'STEP_LATENCY' | 'GRADIENT_NORM';
  public readonly current: number;
  public readonly limit: number;

  constructor(resourceType: 'HEAP_MEMORY' | 'STEP_LATENCY' | 'GRADIENT_NORM', current: number, limit: number) {
    super(
      `Resource limit exceeded for ${resourceType}: Current value ${current} exceeded limit of ${limit}. Aborting fail-closed.`,
      'TRAINING_RESOURCE_EXCEEDED'
    );
    this.name = 'TrainingResourceExceededError';
    this.resourceType = resourceType;
    this.current = current;
    this.limit = limit;
  }
}

export class TrainingNumericalSafetyError extends TrainingEfficiencyError {
  public readonly step: number;
  public readonly valueName: string;

  constructor(step: number, valueName: string, detail: string) {
    super(
      `Numerical safety violation at step ${step} in "${valueName}": ${detail}. Aborting fail-closed.`,
      'TRAINING_NUMERICAL_SAFETY_VIOLATION'
    );
    this.name = 'TrainingNumericalSafetyError';
    this.step = step;
    this.valueName = valueName;
  }
}

export class TrainingActuationBlockedError extends TrainingEfficiencyError {
  public readonly directive: string;

  constructor(directive: string) {
    super(
      `Permanent Hardware Actuation Blocked: Training layer intercepted directive "${directive}" fail-closed.`,
      'HARDWARE_ACTUATION_PROHIBITED'
    );
    this.name = 'TrainingActuationBlockedError';
    this.directive = directive;
  }
}

export class TrainingForeignFrameworkError extends TrainingEfficiencyError {
  public readonly foreignFramework: string;

  constructor(foreignFramework: string) {
    super(
      `Prohibited foreign framework detected: "${foreignFramework}". Sovereign CUBiO training accepts only native compute.`,
      'FOREIGN_TRAINING_FRAMEWORK_PROHIBITED'
    );
    this.name = 'TrainingForeignFrameworkError';
    this.foreignFramework = foreignFramework;
  }
}

// =============================================================================
// DATA CONTRACTS & INTERFACES
// =============================================================================

export interface TrainingBatchConfig {
  readonly batchSize: number;
  readonly gradientAccumulationSteps: number;
  readonly maxSequenceLength: number;
  readonly learningRate: number;
  readonly minLearningRate: number;
  readonly weightDecay: number;
  readonly gradientClipNorm: number;
  readonly epochs: number;
  readonly seed?: number;
}

export interface TrainingResourceLimits {
  readonly maxPeakMemoryBytes: number;
  readonly maxAllowedStepLatencyMs: number;
  readonly maxAllowedGradientNorm: number;
}

export interface TrainingEpisode {
  readonly prompt: string;
  readonly completion: string;
  readonly spatialCellId?: number; // 0..342
  readonly epistemicCategory?: string;
}

export interface TrainingStepMetrics {
  readonly stepIndex: number;
  readonly microBatchIndex: number;
  readonly stepLoss: number;
  readonly meanGradientNorm: number;
  readonly learningRate: number;
  readonly stepLatencyMs: number;
  readonly throughputTokensPerSec: number;
  readonly heapUsedBytes: number;
  readonly parameterUpdatesPerformed: number;
}

export interface TrainingRunTelemetry {
  readonly runId: string;
  readonly modelProfile: string;
  readonly totalSteps: number;
  readonly epochs: number;
  readonly initialLoss: number;
  readonly finalLoss: number;
  readonly deltaLoss: number;
  readonly tokensProcessed: number;
  readonly averageThroughputTokensPerSec: number;
  readonly peakHeapBytes: number;
  readonly durationMs: number;
  readonly stateHash: string;
}

export interface TrainingCheckpoint {
  readonly checkpointId: string;
  readonly runId: string;
  readonly step: number;
  readonly epoch: number;
  readonly stateHash: string;
  readonly vdbSynced: boolean;
  readonly serializedWeights: string;
  readonly timestamp: number;
}
