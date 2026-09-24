/**
 * CUBiO AI — Task 168: Multi-Scale Native Model Training
 * src/cubio/model/native_multiscale_training/types.ts
 *
 * Universal type contracts, architecture scale profiles, benchmarking metrics,
 * and domain error definitions for controlled multi-scale native model training.
 *
 * STRICT INVARIANTS:
 * 1. Zero foreign ML/training frameworks (no PyTorch, HuggingFace, DeepSpeed, Megatron, JAX, etc.).
 * 2. Pure native TypeScript/Node deterministic compute with zero external pretrained weights.
 * 3. Controlled progression across approved native profiles: 219K -> 1M -> 5M -> 20M.
 * 4. Identical tokenizer (478-token vocabulary) & standardized benchmark suite across scales.
 * 5. Primary VDB provenance authority with streaming .3dmemory checkpoint transport.
 * 6. Permanent hardware actuation lockout: IS_ACTUATION_BLOCKED === true.
 */

export const TASK_168_ID = 'CUBIO-TASK-168-MULTI-SCALE-NATIVE-MODEL-TRAINING';
export const IS_ACTUATION_BLOCKED = true;

/**
 * Prohibited foreign ML frameworks and cloud inference engines.
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
]);

/**
 * Supported native model scaling profile identifiers.
 */
export enum MultiScaleProfileId {
  NATIVE_219K = 'NATIVE_219K',
  NATIVE_1M = 'NATIVE_1M',
  NATIVE_5M = 'NATIVE_5M',
  NATIVE_20M = 'NATIVE_20M',
}

/**
 * Architectural specification for each supported scale profile.
 */
export interface ScaleArchitectureProfile {
  readonly profileId: MultiScaleProfileId;
  readonly name: string;
  readonly description: string;
  readonly layerCount: number;
  readonly hiddenDimension: number;
  readonly attentionHeads: number;
  readonly ffnDimension: number;
  readonly vocabSize: number;
  readonly maxSequenceLength: number;
  readonly spatialCells: number;
  readonly epistemicClasses: number;
  readonly parameterCount: number;
  readonly tensorCount: number;
  readonly defaultLearningRate: number;
}

/**
 * Canonical Scale Profiles with exact parameter accounting.
 */
export const MULTI_SCALE_PROFILES: Readonly<Record<MultiScaleProfileId, ScaleArchitectureProfile>> = Object.freeze({
  [MultiScaleProfileId.NATIVE_219K]: Object.freeze({
    profileId: MultiScaleProfileId.NATIVE_219K,
    name: 'CUBiO Native Base 219K (Baseline)',
    description: 'Frozen Phase 10 certified baseline architecture with 219K parameters.',
    layerCount: 4,
    hiddenDimension: 64,
    attentionHeads: 4,
    ffnDimension: 128,
    vocabSize: 478,
    maxSequenceLength: 64,
    spatialCells: 343,
    epistemicClasses: 7,
    parameterCount: 219264,
    tensorCount: 37,
    defaultLearningRate: 0.001,
  }),
  [MultiScaleProfileId.NATIVE_1M]: Object.freeze({
    profileId: MultiScaleProfileId.NATIVE_1M,
    name: 'CUBiO Native Edge 1M',
    description: 'Edge-optimized spatial reasoning model with ~984K parameters.',
    layerCount: 6,
    hiddenDimension: 128,
    attentionHeads: 4,
    ffnDimension: 256,
    vocabSize: 478,
    maxSequenceLength: 64,
    spatialCells: 343,
    epistemicClasses: 7,
    parameterCount: 983936,
    tensorCount: 53,
    defaultLearningRate: 0.0008,
  }),
  [MultiScaleProfileId.NATIVE_5M]: Object.freeze({
    profileId: MultiScaleProfileId.NATIVE_5M,
    name: 'CUBiO Native Compact 5M',
    description: 'Compact conversational reasoning model with ~4.58M parameters.',
    layerCount: 8,
    hiddenDimension: 256,
    attentionHeads: 8,
    ffnDimension: 512,
    vocabSize: 478,
    maxSequenceLength: 64,
    spatialCells: 343,
    epistemicClasses: 7,
    parameterCount: 4583424,
    tensorCount: 69,
    defaultLearningRate: 0.0005,
  }),
  [MultiScaleProfileId.NATIVE_20M]: Object.freeze({
    profileId: MultiScaleProfileId.NATIVE_20M,
    name: 'CUBiO Native Balanced 20M',
    description: 'Balanced multi-step reasoning model with ~17.1M parameters.',
    layerCount: 14,
    hiddenDimension: 384,
    attentionHeads: 12,
    ffnDimension: 768,
    vocabSize: 478,
    maxSequenceLength: 64,
    spatialCells: 343,
    epistemicClasses: 7,
    parameterCount: 17143296,
    tensorCount: 117,
    defaultLearningRate: 0.0003,
  }),
});

/**
 * Multi-scale training execution options.
 */
export interface MultiScaleTrainingConfig {
  readonly epochs: number;
  readonly batchSize: number;
  readonly gradientAccumulationSteps: number;
  readonly learningRateMultiplier?: number;
  readonly weightDecay: number;
  readonly gradientClipNorm: number;
  readonly maxAllowedHeapBytes: number;
  readonly maxAllowedStepLatencyMs: number;
  readonly seed?: number;
}

/**
 * Standardized training and benchmark episode.
 */
export interface MultiScaleEpisode {
  readonly id: string;
  readonly domain: 'SYMBOLIC' | 'SPATIAL' | 'CAUSAL' | 'REASONING';
  readonly prompt: string;
  readonly completion: string;
  readonly spatialCellId?: string;
  readonly expectedPattern?: string;
}

/**
 * Evaluation probe result on benchmark task.
 */
export interface ScaleTaskEvaluationResult {
  readonly domain: string;
  readonly totalProbes: number;
  readonly passedProbes: number;
  readonly accuracy: number;
  readonly averageLoss: number;
}

/**
 * Comprehensive metrics recorded for an individual trained scale.
 */
export interface ScaleTrainingMetrics {
  readonly profileId: MultiScaleProfileId;
  readonly modelName: string;
  readonly parameterCount: number;
  readonly tensorCount: number;
  readonly trainingSteps: number;
  readonly initialLoss: number;
  readonly finalLoss: number;
  readonly lossTrajectory: readonly number[];
  readonly deltaLoss: number;
  readonly peakMemoryBytes: number;
  readonly throughputTokensPerSec: number;
  readonly durationMs: number;
  readonly checkpointHash: string;
  readonly capabilityScore: number; // 0.0 to 1.0 aggregate score on standardized tasks
  readonly computeCostPerTokenMs: number;
  readonly efficiencyRatio: number; // capability improvement per compute & memory cost
  readonly domainScores: Readonly<Record<string, number>>;
}

/**
 * Multi-scale benchmark synthesis report.
 */
export interface MultiScaleBenchmarkReport {
  readonly benchmarkId: string;
  readonly timestamp: number;
  readonly scaleResults: Readonly<Record<string, ScaleTrainingMetrics>>;
  readonly scalingLawAnalysis: {
    readonly lossDropComparison: Readonly<Record<string, number>>;
    readonly capabilityVsCompute: Readonly<Record<string, { capability: number; computeMs: number; memoryMB: number }>>;
    readonly mostEfficientScale: MultiScaleProfileId;
    readonly paretoRanking: readonly MultiScaleProfileId[];
  };
  readonly vdbSynced: boolean;
  readonly isActuationBlocked: boolean;
}

/**
 * Transport checkpoint contract for .3dmemory.
 */
export interface MultiScaleCheckpoint {
  readonly checkpointId: string;
  readonly benchmarkId: string;
  readonly profileId: MultiScaleProfileId;
  readonly parameterCount: number;
  readonly weightsHash: string;
  readonly vdbSynced: boolean;
  readonly format: '.3dmemory';
  readonly createdAt: number;
}

// =============================================================================
// DOMAIN ERRORS
// =============================================================================

export class MultiScaleTrainingError extends Error {
  public readonly code: string;
  public readonly timestamp: number;

  constructor(message: string, code = 'MULTISCALE_TRAINING_ERROR') {
    super(`[MultiScaleTraining] ${message}`);
    this.name = 'MultiScaleTrainingError';
    this.code = code;
    this.timestamp = Date.now();
  }
}

export class MultiScaleResourceExceededError extends MultiScaleTrainingError {
  public readonly resource: 'HEAP_MEMORY' | 'STEP_LATENCY';
  public readonly current: number;
  public readonly limit: number;

  constructor(resource: 'HEAP_MEMORY' | 'STEP_LATENCY', current: number, limit: number) {
    super(
      `Resource limit exceeded for ${resource}: value ${current} exceeded limit ${limit}. Aborting fail-closed.`,
      'MULTISCALE_RESOURCE_EXCEEDED'
    );
    this.name = 'MultiScaleResourceExceededError';
    this.resource = resource;
    this.current = current;
    this.limit = limit;
  }
}

export class MultiScaleActuationBlockedError extends MultiScaleTrainingError {
  public readonly directive: string;

  constructor(directive: string) {
    super(
      `Permanent Hardware Actuation Blocked: Multi-scale trainer intercepted directive "${directive}" fail-closed.`,
      'HARDWARE_ACTUATION_PROHIBITED'
    );
    this.name = 'MultiScaleActuationBlockedError';
    this.directive = directive;
  }
}

export class MultiScaleForeignFrameworkError extends MultiScaleTrainingError {
  public readonly foreignFramework: string;

  constructor(foreignFramework: string) {
    super(
      `Prohibited foreign ML framework/API detected: "${foreignFramework}". Only sovereign native CUBiO architecture is permitted.`,
      'FOREIGN_FRAMEWORK_PROHIBITED'
    );
    this.name = 'MultiScaleForeignFrameworkError';
    this.foreignFramework = foreignFramework;
  }
}
