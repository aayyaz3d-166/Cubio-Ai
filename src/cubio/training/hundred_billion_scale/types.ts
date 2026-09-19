/**
 * CubiO — Universal Spatial Operating Environment
 * Step 86: 100B Real Token Distributed Pretraining & Extreme Scale Validation Types
 *
 * Master specifications for:
 * - 6-Node Distributed Cluster Topology & Dynamic Mesh Networking
 * - ZeRO-3 Complete Partitioning (Optimizer, Gradients, Layer Parameters)
 * - 100,000,000,000+ Real Processed Token Milestones (10B -> 20B -> 30B -> 50B -> 75B -> 100B+)
 * - Immutable Global Cryptographic Token Ledger (L_0 -> L_10B -> ... -> L_100B)
 * - Distributed Checkpoint Chain & Multi-Node Fault Tolerance (1-Node / 2-Node Failure Re-sharding)
 * - Deterministic Resume Verification (||ΔW|| < 1e-12)
 * - 10-Pillar Capability Regression vs Step 85 Baseline
 * - 8-Vector Security Defense Regression
 * - Network, Throughput, Memory & Energy Telemetry (Strict NOT_MEASURED if no sensor)
 * - 20+ Hard Anti-Fabrication Gates & Provenance Validation
 * - Explicit Scientific Classification Separation (REAL_EXECUTED / REAL_MEASURED / SOFTWARE_VALIDATED / THEORETICAL)
 */

import { ResultClassification } from '../../foundation/v1/types';
import { ScientificClassification } from '../../distillation/types';

// ─── 1. DISTRIBUTED CLUSTER TOPOLOGY & NODE TYPES ───────────────────────────

export type ClusterNodeRole = 'COORDINATOR' | 'WORKER' | 'STANDBY';

export type NodeStatusType =
  | 'INITIALIZING'
  | 'READY'
  | 'TRAINING'
  | 'SYNCHRONIZING'
  | 'CHECKPOINTING'
  | 'FAILOVER'
  | 'RECOVERING'
  | 'OFFLINE';

export interface ClusterNodeInfo {
  readonly nodeId: string;
  readonly nodeRank: number;
  readonly worldSize: number;
  readonly role: ClusterNodeRole;
  readonly hostname: string;
  readonly port: number;
  readonly cores: number;
  readonly totalMemoryBytes: number;
  readonly status: NodeStatusType;
  readonly joinedAtTimestamp: number;
  readonly lastHeartbeatTimestamp: number;
  readonly authTokenHash: string;
}

export interface NodeHealthReport {
  readonly nodeId: string;
  readonly isHealthy: boolean;
  readonly latencyMs: number;
  readonly memoryUsageBytes: number;
  readonly cpuLoadPercentage: number;
  readonly droppedPackets: number;
  readonly consecutiveMissedHeartbeats: number;
  readonly lastCheckedTimestamp: number;
}

export interface RendezvousBarrierState {
  readonly barrierId: string;
  readonly epoch: number;
  readonly step: number;
  readonly requiredRanks: number;
  readonly arrivedRanks: readonly number[];
  readonly isUnlocked: boolean;
  readonly timeoutMs: number;
  readonly openedAtTimestamp?: number;
}

// ─── 2. ZERO-3 SHARDING & DISTRIBUTED PARALLELISM ───────────────────────────

export type ZeROStage = 'STAGE_0_DDP' | 'STAGE_1_OPTIMIZER' | 'STAGE_2_GRADIENT' | 'STAGE_3_PARAM';

export type AllReduceAlgorithm = 'RING_ALLREDUCE' | 'TREE_ALLREDUCE' | 'REDUCE_SCATTER_ALLGATHER';

export interface ZeRO3Config {
  readonly stage: ZeROStage;
  readonly offloadOptimizerToCpu: boolean;
  readonly offloadParamsToCpu: boolean;
  readonly overlapComm: boolean;
  readonly contiguousGradients: boolean;
  readonly reduceBucketSize: number;
  readonly allReduceAlgorithm: AllReduceAlgorithm;
}

export interface ParameterShardMetadata {
  readonly layerId: string;
  readonly paramCount: number;
  readonly ownerRank: number;
  readonly startOffset: number;
  readonly endOffset: number;
  readonly shardHash: string;
}

export interface GradientShardMetadata {
  readonly layerId: string;
  readonly gradNorm: number;
  readonly ownerRank: number;
  readonly isReduced: boolean;
  readonly shardHash: string;
}

export interface OptimizerShardMetadata {
  readonly ownerRank: number;
  readonly momentumStateHash: string;
  readonly varianceStateHash: string;
  readonly stepCount: number;
  readonly memorySavingsRatio: number;
}

export interface CommunicationProfileEntry {
  readonly step: number;
  readonly phase: 'ALL_REDUCE' | 'REDUCE_SCATTER' | 'ALL_GATHER' | 'BARRIER';
  readonly durationMs: number;
  readonly transferredBytes: number;
  readonly bandwidthMBps: number;
  readonly overlapWithComputeRatio: number;
}

// ─── 3. 100B REAL DATASET & GLOBAL TOKEN LEDGER ─────────────────────────────

export type HundredBillionModalityStreamType =
  | 'TEXT_WEB_CURATED'
  | 'CODE_AND_SYNTAX'
  | 'MATHEMATICAL_PROOFS'
  | 'SPATIAL_3D_MANIFOLDS'
  | 'MULTI_AGENT_REASONING'
  | 'SCIENTIFIC_LITERATURE'
  | 'MULTIMODAL_INSTRUCTION'
  | 'AUDIO_VISION_TOKENS'
  | 'SYSTEM_KERNEL_LOGIC'
  | 'STRUCTURED_SCHEMA_DATA';

export interface HundredBillionDatasetShard {
  readonly shardId: string;
  readonly stream: HundredBillionModalityStreamType;
  readonly tokenCount: number;
  readonly byteSize: number;
  readonly recordCount: number;
  readonly sha256Checksum: string;
  readonly assignedRank: number;
  readonly isQuarantined: boolean;
  readonly sampleTextSnippet: string;
}

export interface GlobalTokenLedgerEntry {
  readonly ledgerEntryIndex: number;
  readonly globalStep: number;
  readonly nodeRank: number;
  readonly shardId: string;
  readonly stream: HundredBillionModalityStreamType;
  readonly batchTokens: number;
  readonly batchBytes: number;
  readonly cumulativeGlobalTokens: number;
  readonly previousLedgerHash: string;
  readonly currentLedgerHash: string;
  readonly shardChecksum: string;
  readonly timestamp: number;
  readonly runId: string;
  readonly checkpointId: string;
}

export interface GlobalDeduplicationReport {
  readonly totalRecordsScanned: number;
  readonly uniqueRecordsRetained: number;
  readonly duplicateRecordsPruned: number;
  readonly crossNodeDuplicatesDetected: number;
  readonly deduplicationEfficiencyPercent: number;
  readonly tokensPreservedAfterDedup: number;
}

// ─── 4. MILESTONES & GLOBAL CHECKPOINT CHAIN ────────────────────────────────

export type HundredBillionMilestone =
  | 'MILESTONE_C86_10B_INHERITED'
  | 'MILESTONE_C86_20B'
  | 'MILESTONE_C86_30B'
  | 'MILESTONE_C86_50B'
  | 'MILESTONE_C86_75B'
  | 'MILESTONE_C86_100B_TARGET'
  | 'MILESTONE_C86_1T_THEORETICAL'
  | 'MILESTONE_C86_10T_THEORETICAL';

export interface DistributedCheckpointMetadata {
  readonly checkpointId: string;
  readonly milestone: HundredBillionMilestone;
  readonly globalStep: number;
  readonly cumulativeTokens: number;
  readonly worldSize: number;
  readonly rankShardHashes: readonly string[];
  readonly aggregatedWeightsHash: string;
  readonly aggregatedOptimizerHash: string;
  readonly globalTokenLedgerHash: string;
  readonly previousGlobalCheckpointHash: string;
  readonly globalCheckpointHash: string;
  readonly trainLoss: number;
  readonly valLoss: number;
  readonly valPerplexity: number;
  readonly timestamp: number;
  readonly executionClassification: ResultClassification;
}

export interface NodeFailureRecoveryResult {
  readonly failedRanks: readonly number[];
  readonly failureType: 'SINGLE_NODE' | 'MULTI_NODE' | 'NETWORK_INTERRUPTION' | 'CHECKPOINT_CORRUPTION';
  readonly failedAtStep: number;
  readonly recoveredFromCheckpointId: string;
  readonly reassignedShardsCount: number;
  readonly recoveryDurationMs: number;
  readonly stateLosslessProof: boolean;
  readonly resumedGlobalStep: number;
}

export interface ResumeVerificationReport {
  readonly isBitwiseExact: boolean;
  readonly uninterruptedCheckpointHash: string;
  readonly resumedCheckpointHash: string;
  readonly weightDiscrepancyNorm: number;
  readonly optimizerDiscrepancyNorm: number;
  readonly status: 'EXACT_MATCH' | 'DIVERGED';
}

// ─── 5. 10-PILLAR CAPABILITY & SECURITY REGRESSION ──────────────────────────

export interface DistributedPillarRegression {
  readonly pillarId: string;
  readonly pillarName: string;
  readonly step85BaselineScore: number;
  readonly scoreAt20B: number;
  readonly scoreAt50B: number;
  readonly scoreAt100B: number;
  readonly absoluteDelta: number;
  readonly relativeDeltaPercent: number;
  readonly standardError: number;
  readonly status: 'IMPROVED' | 'PRESERVED' | 'REGRESSED';
  readonly classification: ResultClassification;
}

export interface DistributedSecurityDefenseRegression {
  readonly attackVectorId: string;
  readonly vectorName: string;
  readonly totalAttacksTested: number;
  readonly blockedAttacks: number;
  readonly blockRatePercent: number;
  readonly status: 'SECURE' | 'VULNERABLE';
  readonly classification: ResultClassification;
}

// ─── 6. TELEMETRY & HARDWARE LEDGERS ────────────────────────────────────────

export type EnergyMeasurementStatus = 'NOT_MEASURED' | 'SOFTWARE_ESTIMATED' | 'REAL_MEASURED';

export interface ClusterResourceSnapshot {
  readonly timestamp: number;
  readonly activeNodesCount: number;
  readonly totalProcessRSSBytes: number;
  readonly totalHeapUsedBytes: number;
  readonly aggregateTokensPerSec: number;
  readonly clusterScalingEfficiencyPercent: number;
  readonly totalNetworkTransferredBytes: number;
  readonly storageThroughputMBps: number;
  readonly energyStatus: EnergyMeasurementStatus;
  readonly estimatedEnergyJoules?: number;
}

export interface NodeHardwareTelemetry {
  readonly nodeId: string;
  readonly nodeRank: number;
  readonly processRssBytes: number;
  readonly heapUsedBytes: number;
  readonly cpuUsagePercent: number;
  readonly localTokensPerSec: number;
  readonly timestamp: number;
}

// ─── 7. ANTI-FABRICATION AUDIT & MANIFEST ───────────────────────────────────

export interface HundredBillionAntiFabricationAudit {
  readonly overallPassed: boolean;
  readonly auditTimestamp: number;
  readonly totalGatesChecked: number;
  readonly totalGatesPassed: number;
  readonly checks: {
    readonly tokenDerivationValid: boolean;
    readonly datasetHashValid: boolean;
    readonly shardUniquenessValid: boolean;
    readonly batchProvenanceValid: boolean;
    readonly globalLedgerContinuityValid: boolean;
    readonly nodeIdentityConsistent: boolean;
    readonly rankConsistencyValid: boolean;
    readonly checkpointContinuityValid: boolean;
    readonly parameterMutationNonZero: boolean;
    readonly optimizerMutationNonZero: boolean;
    readonly lossMonotonicallyDecreased: boolean;
    readonly validationSplitIsolated: boolean;
    readonly resumeDeterminismExact: boolean;
    readonly faultRecoveryLossless: boolean;
    readonly multiNodeRecoveryValid: boolean;
    readonly communicationIntegrityValid: boolean;
    readonly memoryTelemetryMeasured: boolean;
    readonly throughputTelemetryMeasured: boolean;
    readonly capabilityRegressionPreserved: boolean;
    readonly securityRegressionPreserved: boolean;
    readonly energyStrictlyHandled: boolean;
    readonly zeroHardcodingAuditPassed: boolean;
    readonly scientificClassificationSeparated: boolean;
  };
  readonly auditSummary: string;
  readonly classification: ScientificClassification;
}

export interface HundredBillionTrainingManifest {
  readonly manifestVersion: string;
  readonly runId: string;
  readonly worldSize: number;
  readonly zeroStage: ZeROStage;
  readonly startingCheckpointHash: string;
  readonly endingGlobalCheckpointHash: string;
  readonly totalRealProcessedTokens: number;
  readonly totalTrainingSteps: number;
  readonly initialLoss: number;
  readonly finalLoss: number;
  readonly validationLoss: number;
  readonly validationPerplexity: number;
  readonly peakClusterRSSBytes: number;
  readonly totalNetworkTransferredBytes: number;
  readonly executionTimeMs: number;
  readonly throughputTokensPerSec: number;
  readonly scalingEfficiencyPercent: number;
  readonly energyMeasurementStatus: EnergyMeasurementStatus;
  readonly theoreticalScaleBoundary: string;
  readonly milestones: Readonly<Record<HundredBillionMilestone, 'VERIFIED' | 'PENDING' | 'NOT_EXECUTED'>>;
  readonly capabilityPillars: readonly DistributedPillarRegression[];
  readonly securityDefenses: readonly DistributedSecurityDefenseRegression[];
  readonly antiFabricationAudit: HundredBillionAntiFabricationAudit;
  readonly classification: ScientificClassification;
}
