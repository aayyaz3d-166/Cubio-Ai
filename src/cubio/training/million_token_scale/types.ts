/**
 * CubiO — Universal Spatial Operating Environment
 * Step 81: 1M Real Token Production Training & Scale Validation Types
 *
 * Master specifications for:
 * - 1,000,000+ Real Processed Token Milestones (100K -> 250K -> 500K -> 750K -> 1M)
 * - Cryptographic Token Ledger (T_0 -> T_1 -> ... -> T_N)
 * - Milestone Checkpoint Chain (C_0 -> C_100K -> ... -> C_1M)
 * - 10-Pillar Capability Regression vs Step 80 Baseline
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

export type MillionScaleMilestone =
  | 'MILESTONE_100K'
  | 'MILESTONE_250K'
  | 'MILESTONE_500K'
  | 'MILESTONE_750K'
  | 'MILESTONE_1M'
  | 'MILESTONE_10M_PENDING'
  | 'MILESTONE_100M_PENDING'
  | 'MILESTONE_1B_THEORETICAL';

export type MilestoneVerificationStatus =
  | 'VERIFIED'
  | 'PENDING'
  | 'NOT_EXECUTED';

export type ConvergenceStatusType =
  | 'CONVERGING'
  | 'PLATEAU'
  | 'DIVERGING'
  | 'OVERFITTING'
  | 'INSUFFICIENT_DATA';

// ─── 2. CRYPTOGRAPHIC TOKEN LEDGER ──────────────────────────────────────────

export interface TokenLedgerRecord {
  readonly recordId: string;
  readonly shardId: string;
  readonly datasetVersion: string;
  readonly tokenCount: number;
  readonly byteCount: number;
  readonly modality: ModalityStreamType;
  readonly tokenizerVersion: string;
  readonly timestamp: number;
  readonly shardChecksum: string;
  readonly previousLedgerHash: string; // "GENESIS_TOKEN_LEDGER" for T_0
  readonly ledgerHash: string;
  readonly step: number;
}

export interface ModalityDistributionRecord {
  readonly requestedRatios: Readonly<Record<ModalityStreamType, number>>;
  readonly actualTokensProcessed: Readonly<Record<ModalityStreamType, number>>;
  readonly actualTokenPercentages: Readonly<Record<ModalityStreamType, number>>;
  readonly totalActualTokens: number;
  readonly isMixtureConforming: boolean;
}

// ─── 3. MILESTONE CHECKPOINT CHAIN ──────────────────────────────────────────

export interface MilestoneCheckpointNode {
  readonly checkpointId: string;
  readonly milestone: MillionScaleMilestone;
  readonly step: number;
  readonly tokensProcessed: number;
  readonly modelStateHash: string;
  readonly optimizerStateHash: string;
  readonly schedulerState: string;
  readonly datasetPosition: number;
  readonly previousCheckpointHash: string;
  readonly currentCheckpointHash: string;
  readonly trainingLoss: number;
  readonly validationLoss: number;
  readonly validationPerplexity: number;
  readonly peakRSSBytes: number;
  readonly timestamp: number;
}

// ─── 4. 10-PILLAR CAPABILITY REGRESSION ──────────────────────────────────────

export interface CapabilityRegressionMetric {
  readonly pillarId: string;
  readonly pillarName: string;
  readonly step80BaselineScore: number;
  readonly step81ModelScore: number;
  readonly absoluteDelta: number;
  readonly relativeDeltaPercentage: number;
  readonly confidenceInterval: number;
  readonly hasRegression: boolean;
  readonly executionClassification: ResultClassification;
}

// ─── 5. HARDWARE EVIDENCE & PHYSICAL RESOURCE LEDGER ────────────────────────

export interface PhysicalTelemetryLedger {
  readonly hostPlatform: string;
  readonly cpuCores: number;
  readonly processResidentMemoryBytes: number;
  readonly peakRSSBytes: number;
  readonly streamBufferMemoryBytes: number; // <= 16 MB
  readonly is2GBEdgeCompliant: boolean;     // RSS <= 512 MB
  readonly gpuModel: string | null;          // null if NOT_MEASURED
  readonly gpuVramBytes: number | null;       // null if NOT_MEASURED
  readonly wallClockMs: number;
  readonly tokensPerSecond: number;
  readonly stepsPerSecond: number;
  readonly energyJoules: number | null;       // null if NOT_MEASURED
  readonly measurementClassification: ResultClassification;
}

// ─── 6. ANTI-FABRICATION & PROVENANCE AUDIT ─────────────────────────────────

export interface AntiFabricationAuditRecord {
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

// ─── 7. MASTER STEP 81 MANIFEST ─────────────────────────────────────────────

export interface MillionTokenTrainingManifest {
  readonly manifestId: string;
  readonly runId: string;
  readonly releaseTier: string;
  readonly trainingProfile: string;
  readonly targetTokens: number;
  readonly actualTokensProcessed: number;
  readonly realDatasetShardsProcessed: number;
  readonly optimizerUpdates: number;
  readonly initialLoss: number;
  readonly finalTrainingLoss: number;
  readonly finalValidationLoss: number;
  readonly finalValidationPerplexity: number;
  readonly parameterDeltaL2: number;
  readonly initialWeightChecksum: string;
  readonly finalWeightChecksum: string;
  readonly peakRSSBytes: number;
  readonly maxStreamBufferBytes: number;
  readonly tokensPerSecond: number;
  readonly resumeVariance: number; // 0.000000
  readonly modalityDistribution: ModalityDistributionRecord;
  readonly milestoneStatuses: Readonly<Record<MillionScaleMilestone, MilestoneVerificationStatus>>;
  readonly capabilityRegression: readonly CapabilityRegressionMetric[];
  readonly physicalTelemetry: PhysicalTelemetryLedger;
  readonly checkpointChain: readonly MilestoneCheckpointNode[];
  readonly antiFabricationAudit: AntiFabricationAuditRecord;
  readonly masterMerkleRoot: string;
  readonly executionClassification: ResultClassification;
  readonly scientificClassification: ScientificClassification;
  readonly timestamp: number;
}
