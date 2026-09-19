/**
 * CubiO — Universal Spatial Operating Environment
 * Step 83: 100M Real Token Production Training & Scale-Up Validation Types
 *
 * Master specifications for:
 * - 100,000,000+ Real Processed Token Milestones (20M -> 30M -> 50M -> 75M -> 100M)
 * - Cryptographic Token Ledger (L_0 -> L_1 -> ... -> L_N)
 * - Checkpoint Hash Chain (C_82 -> C_20M -> ... -> C_100M)
 * - Dataset Deduplication & Shard Quarantine
 * - 10-Pillar Capability Regression vs Step 82 Baseline
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

export type HundredMillionMilestone =
  | 'MILESTONE_10M_VERIFIED'
  | 'MILESTONE_20M'
  | 'MILESTONE_30M'
  | 'MILESTONE_50M'
  | 'MILESTONE_75M'
  | 'MILESTONE_100M'
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
  | 'OVERFITTING'
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
  readonly recordsSeen: number;
  readonly uniqueRecords: number;
  readonly duplicateRecords: number;
  readonly duplicateRate: number;
  readonly tokensBeforeDedup: number;
  readonly tokensAfterDedup: number;
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
  readonly milestone: HundredMillionMilestone;
  readonly step: number;
  readonly cumulativeTokens: number;
  readonly modelWeightsHash: string;
  readonly optimizerStateHash: string;
  readonly schedulerStateHash: string;
  readonly rngStateHash: string;
  readonly datasetOffset: number;
  readonly tokenLedgerHash: string;
  readonly datasetManifestHash: string;
  readonly previousCheckpointHash: string;
  readonly checkpointHash: string;
  readonly trainingLoss: number;
  readonly validationLoss: number;
  readonly validationPerplexity: number;
  readonly peakProcessRSSBytes: number;
  readonly timestamp: number;
}

// ─── 4. 10-PILLAR CAPABILITY REGRESSION ──────────────────────────────────────

export interface PillarRegressionResult {
  readonly pillarId: string;
  readonly pillarName: string;
  readonly step82BaselineScore: number;
  readonly scoreAt20M: number;
  readonly scoreAt50M: number;
  readonly scoreAt100M: number;
  readonly absoluteDelta: number;
  readonly relativeDeltaPercentage: number;
  readonly confidenceInterval: number;
  readonly status: 'IMPROVED' | 'PRESERVED' | 'REGRESSED' | 'NOT_MEASURED';
  readonly executionClassification: ResultClassification;
}

// ─── 5. HARDWARE EVIDENCE & PHYSICAL RESOURCE LEDGER ────────────────────────

export interface PhysicalResourceSnapshot {
  readonly hostPlatform: string;
  readonly cpuCores: number;
  readonly processResidentMemoryBytes: number;
  readonly peakProcessRSSBytes: number;
  readonly streamBufferBytes: number; // <= 16 MB
  readonly is2GBEdgeCompliant: boolean; // RSS <= 512 MB
  readonly gpuModel: string | null;     // null if NOT_MEASURED
  readonly gpuVramBytes: number | null;  // null if NOT_MEASURED
  readonly wallClockMs: number;
  readonly tokensPerSecond: number;
  readonly stepsPerSecond: number;
  readonly energyJoules: number | null;  // null if NOT_MEASURED
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

// ─── 7. MASTER STEP 83 MANIFEST ─────────────────────────────────────────────

export interface HundredMillionTrainingManifest {
  readonly manifestId: string;
  readonly runId: string;
  readonly releaseTier: string;
  readonly startingCheckpoint: string;
  readonly endingCheckpoint: string;
  readonly totalTokensProcessed: number;
  readonly milestonesVerified: readonly string[];
  readonly optimizerUpdatesApplied: number;
  readonly parameterDeltaNorm: number;
  readonly initialParameterChecksum: string;
  readonly finalParameterChecksum: string;
  readonly maximumParameterShift: number;
  readonly initialTrainingLoss: number;
  readonly finalTrainingLoss: number;
  readonly finalValidationLoss: number;
  readonly finalValidationPerplexity: number;
  readonly peakProcessRSSBytes: number;
  readonly streamBufferBytes: number;
  readonly resumeSigmaSquared: number; // 0.000000
  readonly capabilityRegression: Record<string, PillarRegressionResult>;
  readonly milestoneStatuses: Readonly<Record<HundredMillionMilestone, MilestoneVerificationStatus>>;
  readonly physicalTelemetry: PhysicalResourceSnapshot;
  readonly deduplicationSummary: DatasetDeduplicationSummary;
  readonly checkpointChain: readonly MilestoneCheckpointEntry[];
  readonly antiFabricationAudit: AntiFabricationAuditResult;
  readonly antiFabricationStatus: string;
  readonly scientificClassification: ScientificClassification;
  readonly masterMerkleRoot: string;
  readonly timestamp: number;
}
