/**
 * CubiO — Universal Spatial Operating Environment
 * Step 55: CubiO Foundation Model v1 — Comprehensive Types
 *
 * Extended specifications for:
 * - Configurable Foundation Architecture (8M / 32M / 128M)
 * - Explicit Result Classification (REAL_MEASURED / SOFTWARE_VALIDATED / SIMULATED / THEORETICAL)
 * - Immutable Training Provenance Records
 * - Full Training Lifecycle Engines (Pre-Training, SFT, DPO, RL)
 * - Evaluation & Checkpoint Management
 */

import { QuantizationFormat } from '../../compute/quantization/types';
import { ScientificClassification } from '../../distillation/types';

// ─── 1. RESULT CLASSIFICATION ───────────────────────────────────────────────

/**
 * Every numeric result MUST be tagged with one of these classifications.
 * Never represent simulation as physical hardware evidence.
 */
export type ResultClassification =
  | 'REAL_MEASURED'
  | 'SOFTWARE_VALIDATED'
  | 'SIMULATED'
  | 'THEORETICAL';

// ─── 2. FOUNDATION MODEL CONFIGURATION ──────────────────────────────────────

export type FoundationSizeTier = '8M' | '32M' | '128M';

export interface FoundationModelConfig {
  readonly sizeTier: FoundationSizeTier;
  readonly modelName: string;
  readonly layerCount: number;
  readonly hiddenDimension: number;
  readonly attentionHeads: number;
  readonly headDimension: number;
  readonly ffnDimension: number;
  readonly vocabSize: number;
  readonly maxSequenceLength: number;
  readonly defaultQuantization: QuantizationFormat;
  readonly exactParameterCount: number;
  readonly trainableParameterCount: number;
  readonly architectureHash: string;
  readonly randomSeed: number;
}

// ─── 3. FROZEN SUBSYSTEM SPECIFICATIONS (preserved) ─────────────────────────

export type FoundationModelStage =
  | 'PRETRAINING'
  | 'SFT'
  | 'DPO'
  | 'RL'
  | 'MULTIMODAL_ALIGNMENT'
  | 'FROZEN_RELEASE';

export interface FrozenArchitectureSpec {
  readonly modelFamily: 'CubiO-Foundation';
  readonly version: '1.0.0';
  readonly layerCount: number;
  readonly hiddenDimension: number;
  readonly attentionHeads: number;
  readonly ffnDimension: number;
  readonly defaultQuantization: 'INT8' | 'INT4';
  readonly isFrozen: boolean;
  readonly checksum: string;
}

export interface FrozenTokenizerSpec {
  readonly tokenizerName: 'CubiO-369-Tokenizer-v1';
  readonly vocabSize: number;
  readonly contextLength: number;
  readonly specialTokens: readonly string[];
  readonly isFrozen: boolean;
  readonly checksum: string;
}

export interface Frozen369StateSpec {
  readonly stateSpaceName: 'CubiO-369-Canonical-State-Space';
  readonly dimensionsCount: 3;
  readonly digitalRootModulus: 9;
  readonly vortexHarmonicConstant: number;
  readonly isFrozen: boolean;
  readonly checksum: string;
}

// ─── 4. TRAINING STEP & PROVENANCE ──────────────────────────────────────────

export interface FoundationTrainingStepResult {
  readonly stepIndex: number;
  readonly loss: number;
  readonly gradientNorm: number;
  readonly learningRate: number;
  readonly tokensProcessed: number;
  readonly throughputTokensPerSec: number;
  readonly residentMemoryBytes: number;
  readonly classification: ResultClassification;
  readonly timestamp: number;
}

export interface TrainingProvenanceRecord {
  readonly provenanceId: string;
  readonly stage: FoundationModelStage;
  readonly config: FoundationModelConfig;
  readonly exactParameterCount: number;
  readonly trainableParameterCount: number;
  readonly datasetVersion: string;
  readonly tokenizerVersion: string;
  readonly architectureHash: string;
  readonly randomSeed: number;
  readonly optimizerAlgorithm: string;
  readonly learningRate: number;
  readonly weightDecay: number;
  readonly precision: QuantizationFormat;
  readonly batchSize: number;
  readonly sequenceLength: number;
  readonly hardwareDescription: string;
  readonly physicalRAMBytes: number;
  readonly vramBytes: number;
  readonly throughputTokensPerSec: number;
  readonly trainingDurationMs: number;
  readonly finalLoss: number;
  readonly validationLoss: number;
  readonly perplexity: number;
  readonly checkpointSizeBytes: number;
  readonly resultClassification: ResultClassification;
  readonly scientificClassification: ScientificClassification;
  readonly timestamp: number;
}

// ─── 5. EVALUATION ──────────────────────────────────────────────────────────

export interface FoundationEvaluationResult {
  readonly evaluationId: string;
  readonly modelName: string;
  readonly sizeTier: FoundationSizeTier;
  readonly perplexity: number;
  readonly crossEntropyLoss: number;
  readonly accuracy: number;
  readonly samplesEvaluated: number;
  readonly evaluationDurationMs: number;
  readonly classification: ResultClassification;
  readonly timestamp: number;
}

// ─── 6. CHECKPOINT ──────────────────────────────────────────────────────────

export interface FoundationCheckpoint {
  readonly checkpointId: string;
  readonly stage: FoundationModelStage;
  readonly step: number;
  readonly loss: number;
  readonly weightsRootCid: string;
  readonly merkleRoot: string;
  readonly sizeBytes: number;
  readonly parentCheckpointId: string | null;
  readonly provenanceRecord: TrainingProvenanceRecord;
  readonly timestamp: number;
}

// ─── 7. MODEL VERSION MANIFEST ──────────────────────────────────────────────

export interface FoundationModelVersionManifest {
  readonly versionId: string;
  readonly versionTag: string;
  readonly modelName: string;
  readonly sizeTier: FoundationSizeTier;
  readonly config: FoundationModelConfig;
  readonly checkpoints: readonly FoundationCheckpoint[];
  readonly evaluations: readonly FoundationEvaluationResult[];
  readonly provenanceRecords: readonly TrainingProvenanceRecord[];
  readonly weightsRootCid: string;
  readonly masterMerkleRoot: string;
  readonly is2GBEdgeCompliant: boolean;
  readonly isProductionReady: boolean;
  readonly resultClassification: ResultClassification;
  readonly scientificClassification: ScientificClassification;
  readonly releaseTimestamp: number;
}

// ─── 8. STAGE RESULTS (preserved) ───────────────────────────────────────────

export interface FoundationStageExecutionResult {
  readonly stage: FoundationModelStage;
  readonly initialLoss: number;
  readonly finalLoss: number;
  readonly lossReductionPercentage: number;
  readonly meanFidelity: number;
  readonly isConverged: boolean;
  readonly stageCheckpointCid: string;
  readonly timestamp: number;
}

export interface CubiO10CheckpointRecord {
  readonly releaseTag: 'CubiO-1.0';
  readonly checkpointId: string;
  readonly totalParameters: number;
  readonly architecture: FrozenArchitectureSpec;
  readonly tokenizer: FrozenTokenizerSpec;
  readonly stateRepresentation: Frozen369StateSpec;
  readonly stageResults: readonly FoundationStageExecutionResult[];
  readonly weightsRootCasCid: string;
  readonly masterMerkleRoot: string;
  readonly is2GBEdgeCompliant: boolean;
  readonly isProductionReady: boolean;
  readonly scientificClassification: ScientificClassification;
  readonly releaseTimestamp: number;
}
