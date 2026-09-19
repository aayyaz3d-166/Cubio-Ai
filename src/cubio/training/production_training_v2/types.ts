/**
 * CubiO — Universal Spatial Operating Environment
 * Step 79: Real Production Training, Dataset Expansion & Capability Validation Types
 *
 * Master specifications for:
 * - Genuine Training Profiles & Execution Run Modes
 * - Multi-Stream Streaming Dataset Shards & Integrity Checks
 * - Forward/Backward Backprop, Gradient Accumulation & AdamW
 * - 10-Pillar Capability Evaluation & NOT_RUN Reporting
 * - Real Hardware Telemetry (RSS <= 512MB) & NOT_MEASURED Reporting
 * - Checkpoint Provenance & Merkle Trees
 * - Scientific Classifications (REAL_MEASURED, REAL_TRAINED, SOFTWARE_VALIDATED, SIMULATED, THEORETICAL)
 */

import { ResultClassification } from '../../foundation/v1/types';
import { ScientificClassification } from '../../distillation/types';

// ─── 1. TRAINING PROFILES & EXECUTION MODES ─────────────────────────────────

export type TrainingProfileType =
  | 'TRAIN_DEBUG'
  | 'TRAIN_EDGE'
  | 'TRAIN_128M'
  | 'TRAIN_512M'
  | 'TRAIN_1B'             // SIMULATED
  | 'TRAIN_7B_SIMULATION'; // THEORETICAL

export type ExecutionRunMode =
  | 'DEMO_RUN'
  | 'SMOKE_TEST'
  | 'UNIT_TEST'
  | 'SOFTWARE_VALIDATION'
  | 'REAL_TRAINING'
  | 'REAL_EVALUATION';

export type ModalityStreamType =
  | 'TEXT'
  | 'VISION'
  | 'AUDIO'
  | '3D_SPATIAL'
  | 'MULTIMODAL_INSTRUCTION';

// ─── 2. DATASET MANIFEST & STREAMING CONTRACTS ──────────────────────────────

export interface DatasetShardRecord {
  readonly shardId: string;
  readonly modality: ModalityStreamType;
  readonly tokenCount: number;
  readonly sha256Checksum: string;
  readonly isQuarantined: boolean;
  readonly split: 'TRAIN' | 'VALIDATION' | 'TEST';
}

export interface DatasetManifestRecord {
  readonly manifestId: string;
  readonly totalShards: number;
  readonly totalTokens: number;
  readonly modalityTokenDistribution: Readonly<Record<ModalityStreamType, number>>;
  readonly manifestHash: string;
  readonly isImmutable: boolean;
}

// ─── 3. STEP TELEMETRY & HARDWARE LEDGER ────────────────────────────────────

export interface StepTelemetryRecord {
  readonly step: number;
  readonly processedTokens: number;
  readonly trainLoss: number;
  readonly gradientNorm: number;
  readonly activeLearningRate: number;
  readonly wallClockStepMs: number;
  readonly processResidentMemoryBytes: number; // <= 512 MB
  readonly tokensPerSecond: number;
}

export interface HardwareTelemetrySnapshot {
  readonly physicalPlatform: string;
  readonly cpuCores: number;
  readonly processRSSBytes: number;
  readonly peakRSSBytes: number;
  readonly isEdge2GBCompliant: boolean; // RSS <= 512 MB
  readonly gpuUtilizationPercent: number | null; // null -> NOT_MEASURED
  readonly vramBytes: number | null;            // null -> NOT_MEASURED
  readonly energyJoules: number | null;         // null -> NOT_MEASURED
  readonly measurementClassification: ResultClassification;
}

// ─── 4. CHECKPOINT & PARAMETER DELTA PROOFS ─────────────────────────────────

export interface ParameterDeltaProofV2 {
  readonly initialChecksum: string;
  readonly finalChecksum: string;
  readonly l2ParameterDeltaNorm: number;       // ||Delta w||_2 > 0
  readonly totalOptimizerUpdatesApplied: number;
  readonly areParametersGenuinelyUpdated: boolean;
}

export interface CheckpointV2Record {
  readonly checkpointId: string;
  readonly step: number;
  readonly tokenCount: number;
  readonly modelScale: string;
  readonly weightsChecksum: string;
  readonly optimizerStateChecksum: string;
  readonly datasetOffset: number;
  readonly randomSeed: number;
  readonly casCID: string;
  readonly merkleRoot: string;
}

// ─── 5. 10-PILLAR CAPABILITY EVALUATION ──────────────────────────────────────

export type CapabilityPillarId =
  | 'LANGUAGE_MODELING'
  | 'MATHEMATICAL_REASONING'
  | 'SPATIAL_REASONING'
  | 'LONG_CONTEXT_RETRIEVAL'
  | 'TOOL_USE_PLANNING'
  | 'MULTIMODAL_ALIGNMENT'
  | '3D_SPATIAL_UNDERSTANDING'
  | 'INSTRUCTION_FOLLOWING'
  | 'ROBUSTNESS'
  | 'GENERALIZATION';

export interface CapabilityBenchmarkResult {
  readonly pillarId: CapabilityPillarId;
  readonly pillarName: string;
  readonly datasetSize: number;
  readonly randomSeed: number;
  readonly baselineScore: number;
  readonly modelScore: number | null; // null if NOT_RUN
  readonly confidenceIntervalRadius: number | null;
  readonly executionStatus: 'EXECUTED' | 'NOT_RUN';
  readonly executionClassification: ResultClassification;
}

// ─── 6. MASTER PRODUCTION TRAINING V2 MANIFEST ──────────────────────────────

export interface ProductionTrainingV2Manifest {
  readonly runId: string;
  readonly modelVersion: string;
  readonly profile: TrainingProfileType;
  readonly runMode: ExecutionRunMode;
  readonly exactParameterCount: number;
  readonly totalTokensProcessed: number;
  readonly totalOptimizerUpdates: number;
  readonly initialTrainLoss: number;
  readonly finalTrainLoss: number;
  readonly heldOutValidationLoss: number;
  readonly heldOutValidationPerplexity: number;
  readonly parameterProof: ParameterDeltaProofV2;
  readonly checkpoint: CheckpointV2Record;
  readonly datasetManifestHash: string;
  readonly hardwareTelemetry: HardwareTelemetrySnapshot;
  readonly capabilityResults: readonly CapabilityBenchmarkResult[];
  readonly resumeVarianceSigmaSq: number; // 0.000000
  readonly masterMerkleRoot: string;
  readonly isOfficiallyProductionCertified: boolean;
  readonly isEdge2GBCompliant: boolean;
  readonly resultClassification: ResultClassification;
  readonly scientificClassification: ScientificClassification;
  readonly timestamp: number;
}
