/**
 * CUBiO AI — Phase 24: Native CUBiO Model Training & Genesis
 * ID: CUBIO-P24-NATIVE-MODEL-GENESIS-001
 * native_model_types.ts
 *
 * Authoritative type definitions, contracts, enums, and constants for:
 * - Native CUBiO Model Architecture (CUBIO-NATIVE-MODEL-V1)
 * - Zero-Start Model Genesis (CUBIO-MODEL-GENESIS-V1)
 * - Native Tokenizer (CUBIO-TOKENIZER-V1)
 * - Exact Parameter Accounting
 * - 10-Stage Training Lifecycle
 * - Epistemic Taxonomy & Non-Fact Lockout
 * - Permanent External Model Lockout & Physical Actuation Lockout
 */

export const CUBIO_P24_ID = 'CUBIO-P24-NATIVE-MODEL-GENESIS-001';
export const CUBIO_NATIVE_MODEL_ID = 'CUBIO-NATIVE-MODEL-V1';
export const CUBIO_MODEL_GENESIS_ID = 'CUBIO-MODEL-GENESIS-V1';
export const CUBIO_LINEAGE_ROOT = 'CUBIO-GENESIS';
export const CUBIO_TOKENIZER_ID = 'CUBIO-TOKENIZER-V1';
export const CUBIO_VOCABULARY_ID = 'CUBIO-VOCAB-V1';
export const CUBIO_CERTIFICATE_ID = 'CUBIO-P24-NATIVE-MODEL-CERT-001';

export const PROHIBITED_EXTERNAL_MODEL_IDENTIFIERS: readonly string[] = [
  'qwen',
  'qwen1.5',
  'qwen2',
  'qwen2.5',
  'llama',
  'llama2',
  'llama3',
  'mistral',
  'mixtral',
  'gemma',
  'gpt',
  'gpt-3',
  'gpt-4',
  'claude',
  'gemini',
  'bert',
  'roberta',
  't5',
  'falcon',
  'deepseek',
  'phi',
  'phi-2',
  'phi-3',
  'chinchilla',
  'palm',
];

export const FORBIDDEN_ACTUATION_PATTERNS: readonly string[] = [
  'actuate_motor',
  'gpio_write',
  'usb_transmit',
  'robotic_arm',
  'hardware_override',
  'relay_trigger',
  'servo_set_angle',
];

/**
 * 7-Tier Epistemic Taxonomy for Native Model outputs
 */
export enum EpistemicStatus {
  FACT = 'FACT',
  OBSERVATION = 'OBSERVATION',
  DERIVATION = 'DERIVATION',
  HYPOTHESIS = 'HYPOTHESIS',
  PREDICTION = 'PREDICTION',
  ASSUMPTION = 'ASSUMPTION',
  UNKNOWN = 'UNKNOWN',
}

/**
 * 10-Stage Training Lifecycle
 */
export enum TrainingLifecycleStage {
  INITIALIZE = 'INITIALIZE',
  LOAD_DATASET = 'LOAD_DATASET',
  VALIDATE_DATASET = 'VALIDATE_DATASET',
  CREATE_GENESIS = 'CREATE_GENESIS',
  INITIALIZE_WEIGHTS = 'INITIALIZE_WEIGHTS',
  TRAIN = 'TRAIN',
  VALIDATE = 'VALIDATE',
  CHECKPOINT = 'CHECKPOINT',
  EVALUATE = 'EVALUATE',
  CERTIFY_CANDIDATE = 'CERTIFY_CANDIDATE',
}

/**
 * Operational state of the native model
 */
export enum ModelOperationalState {
  UNINITIALIZED = 'UNINITIALIZED',
  GENESIS = 'GENESIS',
  INITIALIZED = 'INITIALIZED',
  TRAINING = 'TRAINING',
  EVALUATING = 'EVALUATING',
  READY = 'READY',
  DEGRADED = 'DEGRADED',
  OFFLINE = 'OFFLINE',
  ERROR = 'ERROR',
}

/**
 * Architecture hyperparameters for CUBIO-NATIVE-MODEL-V1
 */
export interface NativeModelConfig {
  readonly modelId: string;
  readonly architectureId: string;
  readonly vocabSize: number;
  readonly embedDim: number;
  readonly numHeads: number;
  readonly numLayers: number;
  readonly maxSeqLen: number;
  readonly numSpatialCells: number; // 343 (7x7x7 HCP lattice)
  readonly numSymbolicAnchors: number; // 26 ([0..25])
  readonly totalAddresses: number; // 369 ([0..368])
  readonly dropout: number;
  readonly masterSeed: number;
}

/**
 * Exact Parameter Accounting Tensor Record
 */
export interface NativeTensorRecord {
  readonly tensorName: string;
  readonly shape: readonly number[];
  readonly dtype: 'float32' | 'float64' | 'int32';
  readonly parameterCount: number;
  readonly trainable: boolean;
  readonly initializationMethod: string;
  readonly checkpointLocation: string;
}

/**
 * Complete Parameter Accounting Inventory
 */
export interface ParameterInventory {
  readonly totalParameters: number;
  readonly trainableParameters: number;
  readonly nonTrainableParameters: number;
  readonly tensors: readonly NativeTensorRecord[];
  readonly accountingVerified: boolean;
}

/**
 * Genesis Identity Record (CUBIO-MODEL-GENESIS-V1)
 */
export interface ModelGenesisRecord {
  readonly genesisId: string;
  readonly modelLineageRoot: string;
  readonly genesisSeed: number;
  readonly parentCheckpoint: null;
  readonly architectureVersion: string;
  readonly vocabularyVersion: string;
  readonly trainingManifestHash: string;
  readonly datasetManifestHash: string;
  readonly initializationMethod: string;
  readonly createdAt: string; // Excluded from state hash for bit-identical reproducibility
  readonly deterministicGenesisStateHash: string;
}

/**
 * Dataset Episode Record
 */
export interface DatasetEpisode {
  readonly id: string;
  readonly category: string;
  readonly prompt: string;
  readonly completion: string;
  readonly epistemicStatus: EpistemicStatus;
  readonly spatialCellId?: number;
  readonly address369?: number;
}

/**
 * Dataset Split
 */
export interface DatasetSplit {
  readonly train: readonly DatasetEpisode[];
  readonly validation: readonly DatasetEpisode[];
  readonly unseenTest: readonly DatasetEpisode[];
  readonly totalEpisodes: number;
  readonly trainTestOverlapCount: number;
  readonly manifestHash: string;
}

/**
 * Training Run Configuration
 */
export interface TrainingConfiguration {
  readonly trainingRunId: string;
  readonly datasetHash: string;
  readonly vocabularyHash: string;
  readonly architectureHash: string;
  readonly genesisHash: string;
  readonly optimizer: 'AdamW' | 'SGD';
  readonly learningRate: number;
  readonly minLearningRate: number;
  readonly scheduler: 'cosine' | 'linear';
  readonly batchSize: number;
  readonly sequenceLength: number;
  readonly epochs: number;
  readonly seed: number;
  readonly dtype: 'float32';
  readonly gradientClippingNorm: number;
  readonly weightDecay: number;
  readonly softwareVersion: string;
  readonly runtimeVersion: string;
}

/**
 * Training Step Telemetry
 */
export interface TrainingStepTelemetry {
  readonly epoch: number;
  readonly step: number;
  readonly loss: number;
  readonly learningRate: number;
  readonly gradientNorm: number;
  readonly isFiniteLoss: boolean;
  readonly isFiniteGradients: boolean;
}

/**
 * Separate Native Model Checkpoint Container (NOT .3dmemory cognitive store)
 */
export interface NativeModelCheckpoint {
  readonly checkpointId: string;
  readonly modelId: string;
  readonly containerType: 'CUBIO_NATIVE_MODEL_CHECKPOINT_V1';
  readonly architectureVersion: string;
  readonly vocabularyVersion: string;
  readonly trainingRunId: string;
  readonly lineageParentStateHash: string | null;
  readonly modelStateHash: string;
  readonly weightsMerkleRoot: string;
  readonly parameterInventory: ParameterInventory;
  readonly weights: Record<string, number[]>;
  readonly evaluationScore: number;
  readonly createdAt: string;
}

/**
 * Lineage Node for Cryptographic DAG
 */
export interface LineageNode {
  readonly nodeId: string;
  readonly nodeType: 'GENESIS' | 'TRAINING_RUN' | 'CHECKPOINT' | 'EVALUATION' | 'CERTIFIED_CANDIDATE';
  readonly parentNodeIds: readonly string[];
  readonly stateHash: string;
  readonly timestamp: string;
  readonly metadata: Record<string, any>;
}

/**
 * Evaluation Metrics across 12 pre-registered categories
 */
export interface EvaluationCategoryResult {
  readonly categoryName: string;
  readonly sampleCount: number;
  readonly correctCount: number;
  readonly accuracy: number;
  readonly meanLoss: number;
  readonly passed: boolean;
}

export interface ModelEvaluationScorecard {
  readonly evaluationId: string;
  readonly checkpointId: string;
  readonly overallAccuracy: number;
  readonly overallLoss: number;
  readonly unknownPrecision: number;
  readonly contradictionAccuracy: number;
  readonly reasoningAccuracy: number;
  readonly spatialAccuracy: number;
  readonly epistemicAccuracy: number;
  readonly categories: readonly EvaluationCategoryResult[];
  readonly isPreRegisteredTargetMet: boolean;
}

/**
 * Baseline Delta Comparison: Untrained vs Trained
 */
export interface BaselineComparison {
  readonly untrainedCheckpointId: string;
  readonly trainedCheckpointId: string;
  readonly deltaAccuracy: number;
  readonly deltaLoss: number;
  readonly deltaReasoning: number;
  readonly deltaSpatial: number;
  readonly deltaEpistemic: number;
  readonly deltaUnknown: number;
  readonly isImprovementDemonstrated: boolean;
}

/**
 * Overfitting Test Report
 */
export interface OverfittingReport {
  readonly trainAccuracy: number;
  readonly validationAccuracy: number;
  readonly unseenTestAccuracy: number;
  readonly trainValDelta: number;
  readonly valTestDelta: number;
  readonly isGeneralizingWell: boolean;
  readonly isMemorizationFlagged: boolean;
}

/**
 * Generation Options for Native Inference
 */
export interface NativeInferenceOptions {
  readonly maxTokens?: number;
  readonly temperature?: number;
  readonly topK?: number;
  readonly enforceEpistemicLockout?: boolean;
  readonly repetitionPenalty?: number; // e.g. 1.25 to discourage n-gram loops
  readonly frequencyPenalty?: number; // e.g. 0.1 to penalize frequent tokens
  readonly promptConditioningWeight?: number; // e.g. 1.2 to 1.5 to boost prompt-aligned tokens
  readonly calibrateEpistemicRouting?: boolean; // calibrate conversational inquiry epistemic classification
}

export interface NativeInferenceOutput {
  readonly text: string;
  readonly tokenIds: readonly number[];
  readonly epistemicStatus: EpistemicStatus;
  readonly spatialCellRef?: number;
  readonly latencyMs: number;
  readonly verifiedLocalNative: boolean;
  readonly externalModelCalls: number;
}
