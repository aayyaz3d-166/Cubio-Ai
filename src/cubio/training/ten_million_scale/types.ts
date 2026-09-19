/**
 * CubiO — Universal Spatial Operating Environment
 * Step 82: 10M Real Token Production Training & Scale-Up Validation Types
 *
 * Master specifications for:
 * - 10,000,000+ Real Processed Token Milestones (1M -> 2M -> 3M -> 5M -> 7.5M -> 10M)
 * - Cryptographic Token Ledger (L_0 -> L_1 -> ... -> L_N)
 * - Checkpoint Hash Chain (C_81 -> C_1M -> ... -> C_10M)
 * - Dataset Deduplication & Shard Quarantine
 * - 10-Pillar Capability Regression vs Step 81 Baseline
 * - Hard Anti-Fabrication Gates & Provenance Validation
 * - Strict Scientific Classification Separation
 */

import { ResultClassification } from '../../foundation/v1/types';
import { ScientificClassification } from '../../distillation/types';

// ─── 1. MODALITIES & MILESTONES ─────────────────────────────────────────────

export type ModalityStreamType =
  | 'TEXT'
  | 'VISION'
  | 'AUDIO'
  | '3D_SPATIAL'
  | 'MULTIMODAL_INSTRUCTION';

export type TenMillionMilestone =
  | 'MILESTONE_1M'
  | 'MILESTONE_2M'
  | 'MILESTONE_3M'
  | 'MILESTONE_5M'
  | 'MILESTONE_7_5M'
  | 'MILESTONE_10M'
  | 'MILESTONE_100M_PENDING'
  | 'MILESTONE_1B_THEORETICAL'
  | 'MILESTONE_10B_THEORETICAL';

export type MilestoneVerificationStatus =
  | 'VERIFIED'
  | 'PENDING'
  | 'NOT_EXECUTED';

export type ConvergenceClassificationType =
  | 'CONVERGING'
  | 'PLATEAU'
  | 'DIVERGING'
  | 'OVERFITTING_RISK'
  | 'INSUFFICIENT_DATA';

// ─── 2. CRYPTOGRAPHIC TOKEN LEDGER & DEDUPLICATION ──────────────────────────

export interface TokenLedgerEntry {
  readonly entryId: string;
  readonly shardId: string;
  readonly datasetVersion: string;
  readonly tokenCount: number;
  readonly byteCount: number;
  readonly modality: ModalityStreamType;
  readonly tokenizerVersion: string;
  readonly timestamp: number;
  readonly shardChecksum: string;
  readonly previousLedgerHash: string; // "GENESIS_TOKEN_LEDGER" for L_0
  readonly cumulativeTokens: number;
  readonly currentLedgerHash: string;
  readonly trainingStep: number;
}

export interface DatasetDeduplicationSummary {
  readonly totalInputRecords: number;
  readonly duplicatesDetected: number;
  readonly duplicatesRemoved: number;
  readonly uniqueRecords: number;
  readonly uniqueTokens: number;
  readonly deduplicationRatioPercentage: number;
}

export interface ModalityMixtureRecord {
  readonly requestedMixture: Readonly<Record<ModalityStreamType, number>>;
  readonly actualMixture: Readonly<Record<ModalityStreamType, number>>;
  readonly actualTokenCounts: Readonly<Record<ModalityStreamType, number>>;
  readonly totalActualTokens: number;
  readonly mixtureDeviationPercentage: number;
  readonly isMixtureConforming: boolean;
}

// ─── 3. MILESTONE CHECKPOINT CHAIN ──────────────────────────────────────────

export interface MilestoneCheckpointEntry {
  readonly checkpointId: string;
  readonly milestone: TenMillionMilestone;
  readonly step: number;
  readonly cumulativeTokens: number;
  readonly modelStateHash: string;
  readonly optimizerStateHash: string;
  readonly schedulerStateHash: string;
  readonly datasetOffset: number;
  readonly tokenLedgerHash: string;
  readonly previousCheckpointHash: string;
  readonly currentCheckpointHash: string;
  readonly trainingLoss: number;
  readonly validationLoss: number;
  readonly validationPerplexity: number;
  readonly peakRSSBytes: number;
  readonly timestamp: number;
}

// ─── 4. 10-PILLAR CAPABILITY REGRESSION ──────────────────────────────────────

export interface PillarRegressionResult {
  readonly pillarId: string;
  readonly pillarName: string;
  readonly step81BaselineScore: number;
  readonly step82ModelScore: number;
  readonly absoluteDelta: number;
  readonly relativeDeltaPercentage: number;
  readonly evaluationSampleCount: number;
  readonly confidenceInterval: number;
  readonly status: 'IMPROVED' | 'PRESERVED' | 'REGRESSED' | 'NOT_MEASURED';
  readonly executionClassification: ResultClassification;
}

// ─── 5. HARDWARE EVIDENCE & PHYSICAL RESOURCE LEDGER ────────────────────────

export interface PhysicalResourceSnapshot {
  readonly hostPlatform: string;
  readonly cpuCores: number;
  readonly processResidentMemoryBytes: number;
  readonly peakRSSBytes: number;
  readonly peakStreamBufferBytes: number; // <= 16 MB
  readonly is2GBEdgeCompliant: boolean;    // RSS <= 512 MB
  readonly gpuModel: string | null;         // null if NOT_MEASURED
  readonly gpuVramBytes: number | null;      // null if NOT_MEASURED
  readonly wallClockMs: number;
  readonly tokensPerSecond: number;
  readonly stepsPerSecond: number;
  readonly energyJoules: number | null;      // null if NOT_MEASURED
  readonly measurementClassification: ResultClassification;
}

// ─── 6. ANTI-FABRICATION & PROVENANCE AUDIT ─────────────────────────────────

export interface AntiFabricationAuditResult {
  readonly isTokenCountDerivationVerified: boolean;
  readonly areDatasetHashesPresent: boolean;
  readonly areShardExecutionsLogged: boolean;
  readonly areGradientsNonZero: boolean;
  readonly areParameterDeltasVerified: boolean;
  readonly isCheckpointChainValid: boolean;
  readonly isFreeOfHardcodedCurves: boolean;
  readonly areValidationSplitsDisjoint: boolean;
  readonly isAuditPassed: boolean;
}

// ─── 7. MASTER STEP 82 MANIFEST ─────────────────────────────────────────────

export interface TenMillionTrainingManifest {
  readonly manifestId: string;
  readonly runId: string;
  readonly releaseTier: string;
  readonly trainingProfile: string;
  readonly startingCheckpoint: string;
  readonly endingCheckpoint: string;
  readonly targetTokens: number;
  readonly actualTokensProcessed: number;
  readonly totalShardsProcessed: number;
  readonly verifiedShards: number;
  readonly quarantinedShards: number;
  readonly datasetMixtureRequested: Readonly<Record<ModalityStreamType, number>>;
  readonly datasetMixtureActual: Readonly<Record<ModalityStreamType, number>>;
  readonly optimizerUpdates: number;
  readonly initialLoss: number;
  readonly finalTrainingLoss: number;
  readonly finalValidationLoss: number;
  readonly finalValidationPerplexity: number;
  readonly initialWeightChecksum: string;
  readonly finalWeightChecksum: string;
  readonly parameterDeltaL2: number;
  readonly peakRSSBytes: number;
  readonly peakStreamBufferBytes: number;
  readonly wallClockMs: number;
  readonly tokensPerSecond: number;
  readonly resumeVariance: number; // 0.000000
  readonly capabilityRegressionStatus: readonly PillarRegressionResult[];
  readonly milestoneStatuses: Readonly<Record<TenMillionMilestone, MilestoneVerificationStatus>>;
  readonly physicalTelemetry: PhysicalResourceSnapshot;
  readonly deduplicationSummary: DatasetDeduplicationSummary;
  readonly checkpointChain: readonly MilestoneCheckpointEntry[];
  readonly antiFabricationAudit: AntiFabricationAuditResult;
  readonly checkpointChainStatus: boolean;
  readonly tokenLedgerStatus: boolean;
  readonly antiFabricationStatus: boolean;
  readonly masterMerkleRoot: string;
  readonly executionClassification: ResultClassification;
  readonly scientificClassification: ScientificClassification;
  readonly timestamp: number;
}
