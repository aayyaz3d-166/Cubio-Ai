/**
 * CubiO — Universal Spatial Operating Environment
 * Step 84: 1B Real Token Production Training & Extreme Scale Validation Types
 *
 * Master specifications for:
 * - 1,000,000,000+ Real Processed Token Milestones (150M -> 250M -> 500M -> 750M -> 900M -> 1B)
 * - Cryptographic Token Ledger (L_0 -> L_1 -> ... -> L_N)
 * - Checkpoint Hash Chain (C_83 -> C_150M -> ... -> C_1B)
 * - Dataset Deduplication & Shard Quarantine
 * - 10-Pillar Capability Regression vs Step 83 Baseline
 * - Security Defense Regression vs Step 76 Baseline
 * - Hard Anti-Fabrication Gates & Provenance Validation
 * - Explicit Model Profile Controls (128M, 512M, 1B, 1B+)
 * - Strict Scientific Classification Separation
 */

import { ResultClassification } from '../../foundation/v1/types';
import { ScientificClassification } from '../../distillation/types';

// ─── 1. MODALITIES, MILESTONES & PROFILES ───────────────────────────────────

export type ModalityStreamType =
  | 'TEXT'
  | 'VISION'
  | 'AUDIO'
  | '3D_SPATIAL'
  | 'MULTIMODAL_INSTRUCTION';

export type BillionTokenMilestone =
  | 'MILESTONE_100M_VERIFIED'
  | 'MILESTONE_150M'
  | 'MILESTONE_250M'
  | 'MILESTONE_50M'
  | 'MILESTONE_500M'
  | 'MILESTONE_750M'
  | 'MILESTONE_900M'
  | 'MILESTONE_1B'
  | 'MILESTONE_10B_THEORETICAL'
  | 'MILESTONE_100B_THEORETICAL';

export type MilestoneVerificationStatus =
  | 'VERIFIED'
  | 'PENDING'
  | 'NOT_EXECUTED';

export type ModelProfileType =
  | 'CUBIO_128M_REAL'
  | 'CUBIO_512M_REAL'
  | 'CUBIO_1B_REAL'
  | 'CUBIO_1B_PLUS_THEORETICAL';

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
  readonly runId: string;
  readonly checkpointId: string;
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
  readonly milestone: BillionTokenMilestone;
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

// ─── 4. 10-PILLAR CAPABILITY & SECURITY REGRESSION ──────────────────────────

export interface PillarRegressionResult {
  readonly pillarId: string;
  readonly pillarName: string;
  readonly step83BaselineScore: number;
  readonly scoreAt250M: number;
  readonly scoreAt500M: number;
  readonly scoreAt1B: number;
  readonly absoluteDelta: number;
  readonly relativeDeltaPercentage: number;
  readonly confidenceInterval: number;
  readonly status: 'IMPROVED' | 'PRESERVED' | 'REGRESSED' | 'NOT_MEASURED';
  readonly executionClassification: ResultClassification;
}

export interface SecurityRegressionResult {
  readonly vectorId: string;
  readonly vectorName: string;
  readonly blockRatePercentage: number;
  readonly attacksTested: number;
  readonly attacksBlocked: number;
  readonly status: 'HARDENED' | 'WARNING' | 'REGRESSED';
  readonly defenseClassification: ResultClassification;
}

// ─── 5. HARDWARE EVIDENCE & PHYSICAL RESOURCE LEDGER ────────────────────────

export interface PhysicalResourceSnapshot {
  readonly hostPlatform: string;
  readonly cpuCores: number;
  readonly processResidentMemoryBytes: number;
  readonly heapUsedBytes: number;
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

// ─── 7. MASTER STEP 84 MANIFEST ─────────────────────────────────────────────

export interface BillionTokenTrainingManifest {
  readonly manifestId: string;
  readonly step: number;
  readonly runId: string;
  readonly modelProfile: ModelProfileType;
  readonly releaseTier: string;
  readonly startingCheckpoint: string;
  readonly endingCheckpoint: string;
  readonly actualProcessedTokens: number;
  readonly actualShardCount: number;
  readonly actualOptimizerUpdates: number;
  readonly milestonesVerified: readonly string[];
  readonly parameterDeltaNorm: number;
  readonly initialParameterChecksum: string;
  readonly finalParameterChecksum: string;
  readonly maximumParameterShift: number;
  readonly trainingLossInitial: number;
  readonly trainingLossFinal: number;
  readonly validationLoss: number;
  readonly validationPerplexity: number;
  readonly peakProcessRSSBytes: number;
  readonly streamBufferBytes: number;
  readonly resumeVariance: number; // 0.000000
  readonly capabilityResults: Record<string, PillarRegressionResult>;
  readonly securityResults: Record<string, SecurityRegressionResult>;
  readonly milestoneStatuses: Readonly<Record<BillionTokenMilestone, MilestoneVerificationStatus>>;
  readonly physicalTelemetry: PhysicalResourceSnapshot;
  readonly deduplicationSummary: DatasetDeduplicationSummary;
  readonly checkpointChain: readonly MilestoneCheckpointEntry[];
  readonly antiFabricationAudit: AntiFabricationAuditResult;
  readonly antiFabricationStatus: string;
  readonly scientificClassification: ScientificClassification;
  readonly executionClassification: ResultClassification;
  readonly datasetRootHash: string;
  readonly tokenLedgerRoot: string;
  readonly checkpointMerkleRoot: string;
  readonly timestamp: number;
}
