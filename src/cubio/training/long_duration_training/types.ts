/**
 * CubiO — Universal Spatial Operating Environment
 * Step 80: Long-Duration Real Training & Scale-Up Laboratory Types
 *
 * Master specifications for:
 * - Multi-stage token scaling: STAGE_0 (100K) -> STAGE_4 (1B+)
 * - Immutable Token Ledger & Shard Tracking
 * - Cryptographic Checkpoint Hash Chain (C_0 -> C_1 -> ... -> C_T)
 * - Session Management (START, PAUSE, RESUME, CRASH_RECOVER)
 * - Anti-Fabrication & Anti-Tamper Enforcement
 * - Empirical Hardware Telemetry & Progress Auditing
 */

import { ResultClassification } from '../../foundation/v1/types';
import { ScientificClassification } from '../../distillation/types';

// ─── 1. STAGES, PROFILES & MILESTONES ───────────────────────────────────────

export type TrainingStageType =
  | 'STAGE_0_100K'
  | 'STAGE_1_1M'
  | 'STAGE_2_10M'
  | 'STAGE_3_100M'
  | 'STAGE_4_1B_THEORETICAL';

export type ScalingProfileType =
  | 'CUBIO_128M_REAL'
  | 'CUBIO_512M_REAL'
  | 'CUBIO_1B_THEORETICAL'
  | 'CUBIO_7B_THEORETICAL';

export type MilestoneStatus =
  | 'VERIFIED'
  | 'PENDING'
  | 'NOT_EXECUTED';

export type ConvergenceClassification =
  | 'CONVERGING'
  | 'PLATEAU'
  | 'DIVERGING'
  | 'OVERFITTING'
  | 'INSUFFICIENT_DATA';

// ─── 2. TOKEN LEDGER & SHARDS ───────────────────────────────────────────────

export type ModalityStreamType =
  | 'TEXT'
  | 'VISION'
  | 'AUDIO'
  | '3D_SPATIAL'
  | 'MULTIMODAL_INSTRUCTION';

export interface TokenLedgerEntry {
  readonly entryId: string;
  readonly shardId: string;
  readonly datasetHash: string;
  readonly tokenCount: number;
  readonly modality: ModalityStreamType;
  readonly startTimeMs: number;
  readonly endTimeMs: number;
  readonly shardChecksum: string;
  readonly trainingStep: number;
}

export interface ModalityMixtureAccounting {
  readonly requestedMixture: Readonly<Record<ModalityStreamType, number>>;
  readonly actualTokensProcessed: Readonly<Record<ModalityStreamType, number>>;
  readonly totalActualTokens: number;
  readonly isMixtureBalanced: boolean;
}

// ─── 3. CRYPTOGRAPHIC CHECKPOINT CHAIN ──────────────────────────────────────

export interface CheckpointChainNode {
  readonly checkpointId: string;
  readonly step: number;
  readonly tokensProcessed: number;
  readonly modelChecksum: string;
  readonly optimizerChecksum: string;
  readonly datasetPosition: number;
  readonly configurationHash: string;
  readonly architectureHash: string;
  readonly previousCheckpointHash: string; // "GENESIS" for C_0
  readonly checkpointHash: string;
  readonly timestamp: number;
}

// ─── 4. TELEMETRY & HARDWARE LEDGER ─────────────────────────────────────────

export interface HardwareEvidenceRecord {
  readonly cpuModel: string;
  readonly cpuCores: number;
  readonly systemTotalRamBytes: number;
  readonly processResidentMemoryBytes: number;
  readonly peakProcessRSSBytes: number;
  readonly is2GBEdgeCompliant: boolean;
  readonly gpuModel: string | null;           // null if NOT_MEASURED
  readonly gpuVramBytes: number | null;        // null if NOT_MEASURED
  readonly gpuUtilizationPercent: number | null; // null if NOT_MEASURED
  readonly wallClockDurationSeconds: number;
  readonly tokensPerSecond: number;
  readonly stepsPerSecond: number;
  readonly energyJoules: number | null;        // null if NOT_MEASURED
  readonly measurementClassification: ResultClassification;
}

// ─── 5. ANTI-FABRICATION & QUALITY GATES ────────────────────────────────────

export interface AntiFabricationAuditResult {
  readonly isTokenLedgerConsistent: boolean;
  readonly areLossesDynamicallyComputed: boolean;
  readonly areGradientsNonZero: boolean;
  readonly areParameterDeltasVerified: boolean;
  readonly isCheckpointChainValid: boolean;
  readonly isFreeOfManufacturedCurves: boolean;
  readonly isAuditPassed: boolean;
}

// ─── 6. MASTER STEP 80 TRAINING MANIFEST ────────────────────────────────────

export interface LongDurationTrainingManifest {
  readonly manifestId: string;
  readonly step: 80;
  readonly modelVersion: string;
  readonly profile: ScalingProfileType;
  readonly stage: TrainingStageType;
  readonly requestedTokens: number;
  readonly actualTokensProcessed: number;
  readonly optimizerUpdatesApplied: number;
  readonly initialLoss: number;
  readonly finalLoss: number;
  readonly heldOutValidationLoss: number;
  readonly heldOutValidationPerplexity: number;
  readonly parameterDeltaL2Norm: number;
  readonly convergenceStatus: ConvergenceClassification;
  readonly modalityAccounting: ModalityMixtureAccounting;
  readonly hardwareTelemetry: HardwareEvidenceRecord;
  readonly checkpointChain: readonly CheckpointChainNode[];
  readonly milestoneStatus: Record<TrainingStageType, MilestoneStatus>;
  readonly antiFabricationAudit: AntiFabricationAuditResult;
  readonly resumeVarianceSigmaSq: number; // 0.000000
  readonly masterMerkleRoot: string;
  readonly isOfficiallyLongRunCertified: boolean;
  readonly resultClassification: ResultClassification;
  readonly scientificClassification: ScientificClassification;
  readonly timestamp: number;
}
