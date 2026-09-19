/**
 * CubiO — Universal Spatial Operating Environment
 * Phase 48: Step 47 Large-Scale Native Training Engine Types
 *
 * Master specifications for:
 * - Master Training Run Configurations & Parameter Locks
 * - Multi-Phase Training: SFT -> DPO -> Online RL -> Distillation
 * - Immutable Training Ledger & Real-Time Metrics Tracking
 * - Multi-Path Evaluation Checkpoints & 369 Harmonic Scoring
 * - Locked Model Versioning (v1.0.0..vN) with Full Merkle Provenance
 * - Scientific Hardware vs Logical VCF Resource Separation
 * - Strict 2GB Edge Working-Set Budget (<= 512 MB physical RSS)
 */

import { ModalityType } from '../../multimodal/types';
import { QuantizationFormat } from '../../compute/quantization/types';
import { ModelScaleProfile, ScalableModelArchitectureConfig } from '../../model/scaling/types';
import { CrossModalPathScore } from '../multimodal/types';
import { ScientificClassification } from '../../distillation/types';

// ─── 1. MASTER TRAINING RUN CONFIGURATION ────────────────────────────────────

export type TrainingPhaseType = 'SFT' | 'DPO' | 'ONLINE_RL' | 'DISTILLATION' | 'MULTIMODAL_ALIGNMENT';

export interface MasterTrainingRunConfig {
  readonly runId: string;
  readonly runName: string;
  readonly datasetName: string;
  readonly datasetVersionTag: string;
  readonly modelProfile: ModelScaleProfile;
  readonly customModelConfig?: ScalableModelArchitectureConfig;
  readonly parentModelVersionId?: string;
  readonly phases: readonly TrainingPhaseType[];
  readonly epochsPerPhase: number;
  readonly targetLoss: number;
  readonly batchSize: number;
  readonly learningRate: number;
  readonly gradientAccumulationSteps: number;
  readonly quantization: QuantizationFormat;
  readonly randomSeed: number;
  readonly isTestData: boolean; // Explicit scientific tag: true if using synthetic test data
}

// ─── 2. PHASE PROGRESS & TRAINING LEDGER ────────────────────────────────────

export interface PhaseProgressReport {
  readonly phase: TrainingPhaseType;
  readonly epoch: number;
  readonly step: number;
  readonly trainLoss: number;
  readonly valLoss: number;
  readonly gradientNorm: number;
  readonly learningRate: number;
  readonly throughputSamplesPerSec: number;
  readonly throughputTokensPerSec: number;
  readonly residentRamBytes: number;
  readonly is2GBCompliant: boolean;
  readonly phaseCompleted: boolean;
}

export interface TrainingLedgerEntry {
  readonly stepId: string;
  readonly runId: string;
  readonly epoch: number;
  readonly phase: TrainingPhaseType;
  readonly trainLoss: number;
  readonly valLoss: number;
  readonly gradientNorm: number;
  readonly learningRate: number;
  readonly throughputSamplesPerSec: number;
  readonly tokensPerSec: number;
  readonly syncLatencyMs: number;
  readonly residentRamBytes: number;
  readonly isSyntheticData: boolean;
  readonly checksum: string;
  readonly timestamp: number;
}

// ─── 3. EVALUATION CHECKPOINT & METRICS ─────────────────────────────────────

export interface MasterEvaluationCheckpoint {
  readonly checkpointId: string;
  readonly runId: string;
  readonly epoch: number;
  readonly phase: TrainingPhaseType;
  readonly overallFidelity: number;
  readonly textPerplexity: number;
  readonly harmonic369Score: number;
  readonly pathScores: readonly CrossModalPathScore[];
  readonly casCheckpointCid: string;
  readonly merkleRoot: string;
  readonly timestamp: number;
}

// ─── 4. LOCKED MODEL VERSION MANIFEST ───────────────────────────────────────

export interface LockedModelVersionManifest {
  readonly modelVersionId: string;
  readonly modelVersionTag: string; // e.g. 'v1.0.0'
  readonly modelName: string;
  readonly profile: ModelScaleProfile;
  readonly totalParameters: number;
  readonly trainingRunId: string;
  readonly datasetManifestCid: string;
  readonly finalLoss: number;
  readonly finalAccuracy: number;
  readonly casWeightsRootCid: string;
  readonly merkleRoot: string;
  readonly parentVersionId?: string;
  readonly scientificClassification: ScientificClassification;
  readonly is2GBEdgeCompliant: boolean;
  readonly createdTimestamp: number;
}

// ─── 5. SCIENTIFIC RESOURCE LEDGER & MASTER REPORT ──────────────────────────

export interface ScientificMasterResourceLedger {
  readonly physicalRamResidentBytes: number;
  readonly physicalVramResidentBytes: number;
  readonly virtualRamCapacityBytes: number;
  readonly virtualVramCapacityBytes: number;
  readonly physicalCpuCores: number;
  readonly physicalGpuCores: number;
  readonly activeVLanesCount: number;
  readonly totalModelParameters: number;
  readonly casStorageBytes: number;
  readonly networkTransferBytes: number;
  readonly activeQuantization: QuantizationFormat;
  readonly scientificClassification: ScientificClassification;
}

export type MasterRunStatus = 'SUCCESS' | 'RESOURCE_LIMIT_REACHED' | 'FAILED' | 'CANCELLED';

export interface MasterTrainingReport {
  readonly runId: string;
  readonly config: MasterTrainingRunConfig;
  readonly phaseReports: readonly PhaseProgressReport[];
  readonly evaluationSummary: MasterEvaluationCheckpoint;
  readonly lockedModelVersion: LockedModelVersionManifest;
  readonly ledgerEntriesCount: number;
  readonly resourceLedger: ScientificMasterResourceLedger;
  readonly is2GBEdgeCompliant: boolean;
  readonly completionStatus: MasterRunStatus;
  readonly totalDurationMs: number;
  readonly timestamp: number;
}
