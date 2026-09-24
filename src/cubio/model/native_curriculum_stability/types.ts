/**
 * CUBiO AI — Task 167: Native Curriculum & Training Stability
 * src/cubio/model/native_curriculum_stability/types.ts
 *
 * Universal type contracts, domain errors, stage specifications, and telemetry definitions
 * for native curriculum progression, numerical stability governance, and stage verification.
 *
 * STRICT INVARIANTS:
 * 1. Zero foreign ML/training frameworks (no PyTorch, HuggingFace, DeepSpeed, Megatron, JAX, etc.).
 * 2. Pure native TypeScript/Node deterministic compute with zero external pretrained weights.
 * 3. 4-Stage Progressive Curriculum: Primitives -> Spatial Relations -> Causal Epistemics -> Multi-Step Reasoning.
 * 4. Numerical stability guards: loss spike detection (> 2.5x), gradient clipping, bounded LR annealing.
 * 5. Primary VDB provenance authority with streaming .3dmemory checkpoint transport.
 * 6. Permanent hardware actuation lockout: IS_ACTUATION_BLOCKED === true.
 */

export const TASK_167_ID = 'CUBIO-TASK-167-NATIVE-CURRICULUM-STABILITY';
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
  'openai',
  'anthropic',
]);

/**
 * 4-Tier Native Curriculum Stages in strict progressive order.
 */
export enum CurriculumStage {
  STAGE_1_SYMBOLIC_PRIMITIVES = 'STAGE_1_SYMBOLIC_PRIMITIVES',
  STAGE_2_SPATIAL_RELATIONS = 'STAGE_2_SPATIAL_RELATIONS',
  STAGE_3_CAUSAL_EPISTEMICS = 'STAGE_3_CAUSAL_EPISTEMICS',
  STAGE_4_MULTI_STEP_REASONING = 'STAGE_4_MULTI_STEP_REASONING',
}

export const CURRICULUM_STAGE_SEQUENCE: readonly CurriculumStage[] = Object.freeze([
  CurriculumStage.STAGE_1_SYMBOLIC_PRIMITIVES,
  CurriculumStage.STAGE_2_SPATIAL_RELATIONS,
  CurriculumStage.STAGE_3_CAUSAL_EPISTEMICS,
  CurriculumStage.STAGE_4_MULTI_STEP_REASONING,
]);

/**
 * Specification for each curriculum stage.
 */
export interface CurriculumStageSpec {
  readonly stage: CurriculumStage;
  readonly name: string;
  readonly description: string;
  readonly learningRate: number;
  readonly minLearningRate: number;
  readonly maxGradNorm: number;
  readonly maxAllowedLossSpikeFactor: number;
  readonly minLossDrop: number;
  readonly validationThreshold: number; // minimum accuracy probe required to unlock next stage
  readonly epochs: number;
  readonly batchSize: number;
  readonly gradientAccumulationSteps: number;
  readonly weightDecay: number;
}

/**
 * Default specifications per curriculum stage with annealed learning rates and tighter tolerances.
 */
export const DEFAULT_CURRICULUM_SPECS: Readonly<Record<CurriculumStage, CurriculumStageSpec>> = Object.freeze({
  [CurriculumStage.STAGE_1_SYMBOLIC_PRIMITIVES]: Object.freeze({
    stage: CurriculumStage.STAGE_1_SYMBOLIC_PRIMITIVES,
    name: 'Symbolic Primitives & Syntax Anchoring',
    description: 'Basic token identity, vocabulary co-occurrence, and atomic syntax patterns.',
    learningRate: 0.001,
    minLearningRate: 0.0002,
    maxGradNorm: 1.0,
    maxAllowedLossSpikeFactor: 2.5,
    minLossDrop: 0.01,
    validationThreshold: 0.60,
    epochs: 2,
    batchSize: 2,
    gradientAccumulationSteps: 2,
    weightDecay: 0.01,
  }),
  [CurriculumStage.STAGE_2_SPATIAL_RELATIONS]: Object.freeze({
    stage: CurriculumStage.STAGE_2_SPATIAL_RELATIONS,
    name: '3D Spatial Relations & HCP Grounding',
    description: 'Hexagonal close-packed lattice adjacency, spatial vector coordinates, and geometric anchoring.',
    learningRate: 0.0008,
    minLearningRate: 0.00015,
    maxGradNorm: 1.0,
    maxAllowedLossSpikeFactor: 2.5,
    minLossDrop: 0.01,
    validationThreshold: 0.65,
    epochs: 2,
    batchSize: 2,
    gradientAccumulationSteps: 2,
    weightDecay: 0.01,
  }),
  [CurriculumStage.STAGE_3_CAUSAL_EPISTEMICS]: Object.freeze({
    stage: CurriculumStage.STAGE_3_CAUSAL_EPISTEMICS,
    name: 'Causal Inference & Epistemic Calibration',
    description: '7-tier epistemic state assertions, causal consequence chains, and evidence verification.',
    learningRate: 0.0005,
    minLearningRate: 0.0001,
    maxGradNorm: 0.8,
    maxAllowedLossSpikeFactor: 2.2,
    minLossDrop: 0.01,
    validationThreshold: 0.70,
    epochs: 2,
    batchSize: 2,
    gradientAccumulationSteps: 2,
    weightDecay: 0.01,
  }),
  [CurriculumStage.STAGE_4_MULTI_STEP_REASONING]: Object.freeze({
    stage: CurriculumStage.STAGE_4_MULTI_STEP_REASONING,
    name: 'Multi-Step Deductive & Counterfactual Reasoning',
    description: 'Multi-hop premise-to-conclusion chains, hypothesis validation, and counterfactual simulation.',
    learningRate: 0.0003,
    minLearningRate: 0.00005,
    maxGradNorm: 0.5,
    maxAllowedLossSpikeFactor: 2.0,
    minLossDrop: 0.01,
    validationThreshold: 0.75,
    epochs: 2,
    batchSize: 2,
    gradientAccumulationSteps: 2,
    weightDecay: 0.01,
  }),
});

/**
 * Dataset training and validation episode contract.
 */
export interface CurriculumEpisode {
  readonly id: string;
  readonly stage: CurriculumStage;
  readonly prompt: string;
  readonly completion: string;
  readonly spatialCellId?: string;
  readonly expectedPattern?: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

/**
 * Validation probe result evaluating model understanding after a stage.
 */
export interface CurriculumProbeResult {
  readonly stage: CurriculumStage;
  readonly totalProbes: number;
  readonly passedProbes: number;
  readonly accuracy: number;
  readonly threshold: number;
  readonly passed: boolean;
  readonly probeDetails: readonly { prompt: string; expected: string; matched: boolean; predictedPrefix: string }[];
}

/**
 * Stage metrics recorded upon stage completion.
 */
export interface CurriculumStageMetrics {
  readonly stage: CurriculumStage;
  readonly epochsCompleted: number;
  readonly initialLoss: number;
  readonly finalLoss: number;
  readonly deltaLoss: number;
  readonly converged: boolean;
  readonly peakGradNorm: number;
  readonly meanGradNorm: number;
  readonly parameterUpdates: number;
  readonly probeResult: CurriculumProbeResult;
  readonly durationMs: number;
}

/**
 * Full curriculum run telemetry and provenance.
 */
export interface CurriculumRunTelemetry {
  readonly runId: string;
  readonly modelProfile: string;
  readonly modelChecksum: string;
  readonly initialModelHash: string;
  readonly finalModelHash: string;
  readonly stagesCompleted: readonly CurriculumStage[];
  readonly stageMetrics: Readonly<Record<string, CurriculumStageMetrics>>;
  readonly overallInitialLoss: number;
  readonly overallFinalLoss: number;
  readonly totalTokensProcessed: number;
  readonly totalParameterUpdates: number;
  readonly peakHeapBytes: number;
  readonly durationMs: number;
  readonly isActuationBlocked: boolean;
  readonly timestamp: number;
  readonly vdbSynced: boolean;
}

/**
 * Checkpoint contract for .3dmemory transport.
 */
export interface CurriculumCheckpoint {
  readonly checkpointId: string;
  readonly runId: string;
  readonly stage: CurriculumStage;
  readonly modelProfile: string;
  readonly weightsHash: string;
  readonly vdbSynced: boolean;
  readonly format: '.3dmemory';
  readonly createdAt: number;
}

// =============================================================================
// DOMAIN ERRORS
// =============================================================================

export class CurriculumStabilityError extends Error {
  public readonly code: string;
  public readonly timestamp: number;

  constructor(message: string, code = 'CURRICULUM_STABILITY_ERROR') {
    super(`[CurriculumStability] ${message}`);
    this.name = 'CurriculumStabilityError';
    this.code = code;
    this.timestamp = Date.now();
  }
}

export class CurriculumDivergenceError extends CurriculumStabilityError {
  public readonly stage: CurriculumStage;
  public readonly step: number;
  public readonly prevLoss: number;
  public readonly currentLoss: number;
  public readonly spikeRatio: number;

  constructor(stage: CurriculumStage, step: number, prevLoss: number, currentLoss: number, spikeRatio: number) {
    super(
      `Loss spike or divergence in ${stage} at step ${step}: Current loss ${currentLoss.toFixed(4)} is ${spikeRatio.toFixed(2)}x previous loss ${prevLoss.toFixed(4)}. Aborting fail-closed.`,
      'CURRICULUM_DIVERGENCE_ERROR'
    );
    this.name = 'CurriculumDivergenceError';
    this.stage = stage;
    this.step = step;
    this.prevLoss = prevLoss;
    this.currentLoss = currentLoss;
    this.spikeRatio = spikeRatio;
  }
}

export class CurriculumStageProgressionError extends CurriculumStabilityError {
  public readonly requestedStage: CurriculumStage;
  public readonly prerequisiteStage: CurriculumStage;

  constructor(requestedStage: CurriculumStage, prerequisiteStage: CurriculumStage, reason: string) {
    super(
      `Illegal curriculum stage progression: Cannot advance to ${requestedStage} because prerequisite ${prerequisiteStage} failed requirement (${reason}).`,
      'CURRICULUM_STAGE_PROGRESSION_ERROR'
    );
    this.name = 'CurriculumStageProgressionError';
    this.requestedStage = requestedStage;
    this.prerequisiteStage = prerequisiteStage;
  }
}

export class CurriculumActuationBlockedError extends CurriculumStabilityError {
  public readonly directive: string;

  constructor(directive: string) {
    super(
      `Permanent Hardware Actuation Blocked: Curriculum layer intercepted directive "${directive}" fail-closed.`,
      'HARDWARE_ACTUATION_PROHIBITED'
    );
    this.name = 'CurriculumActuationBlockedError';
    this.directive = directive;
  }
}

export class CurriculumForeignFrameworkError extends CurriculumStabilityError {
  public readonly foreignFramework: string;

  constructor(foreignFramework: string) {
    super(
      `Prohibited foreign ML framework/API detected: "${foreignFramework}". Only sovereign native CUBiO architecture is permitted.`,
      'FOREIGN_FRAMEWORK_PROHIBITED'
    );
    this.name = 'CurriculumForeignFrameworkError';
    this.foreignFramework = foreignFramework;
  }
}
