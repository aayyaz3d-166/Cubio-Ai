/**
 * CubiO — Universal Spatial Operating Environment
 * Step 85: Multi-Node Distributed Cluster Pretraining & 10B Real Token Scale Validation Types
 *
 * Master specifications for:
 * - Multi-Node Distributed Data Parallelism & ZeRO Sharding (ZeRO-1, ZeRO-2, ZeRO-3)
 * - 10,000,000,000+ Real Processed Token Milestones (1B -> 2B -> 3B -> 5B -> 7.5B -> 10B+)
 * - Global Cryptographic Token Ledger (L_0 -> L_1B -> ... -> L_10B)
 * - Distributed Checkpoint Chain & Deterministic Crash Recovery
 * - Cross-Node Global Deduplication & Shard Integrity Verification
 * - 10-Pillar Capability Regression vs Step 84 Baseline
 * - 8-Vector Security Defense Regression
 * - Network, Throughput & Hardware Telemetry (REAL_MEASURED)
 * - Strict Energy Accounting: NOT_MEASURED if no physical power sensor exists
 * - 12 Hard Anti-Fabrication Gates & Provenance Validation
 * - Explicit Scientific Classification Separation
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
  | 'DEGRADED'
  | 'OFFLINE'
  | 'RECOVERING';

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

// ─── 2. ZERO SHARDING & DISTRIBUTED PARALLELISM ─────────────────────────────

export type ZeROStage = 'STAGE_0_DDP' | 'STAGE_1_OPTIMIZER' | 'STAGE_2_GRADIENT' | 'STAGE_3_PARAM';

export type AllReduceAlgorithm = 'RING_ALLREDUCE' | 'TREE_ALLREDUCE' | 'REDUCE_SCATTER_ALLGATHER';

export interface ZeROConfig {
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

// ─── 3. 10B REAL DATASET & GLOBAL TOKEN LEDGER ──────────────────────────────

export type TenBillionModalityStreamType =
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

export interface TenBillionDatasetShard {
  readonly shardId: string;
  readonly stream: TenBillionModalityStreamType;
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
  readonly stream: TenBillionModalityStreamType;
  readonly batchTokens: number;
  readonly batchBytes: number;
  readonly cumulativeGlobalTokens: number;
  readonly previousLedgerHash: string;
  readonly currentLedgerHash: string;
  readonly shardChecksum: string;
  readonly timestamp: number;
  readonly runId: string;
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

export type TenBillionMilestone =
  | 'MILESTONE_C85_1B_INHERITED'
  | 'MILESTONE_C85_2B'
  | 'MILESTONE_C85_3B'
  | 'MILESTONE_C85_5B'
  | 'MILESTONE_C85_7_5B'
  | 'MILESTONE_C85_10B_TARGET'
  | 'MILESTONE_C85_100B_THEORETICAL'
  | 'MILESTONE_C85_1T_THEORETICAL';

export interface DistributedCheckpointMetadata {
  readonly checkpointId: string;
  readonly milestone: TenBillionMilestone;
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

export interface CrashRecoveryResult {
  readonly failureRank: number;
  readonly failedAtStep: number;
  readonly recoveredFromCheckpointId: string;
  readonly reshardingTimeMs: number;
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
  readonly step84BaselineScore: number;
  readonly scoreAt2B: number;
  readonly scoreAt5B: number;
  readonly scoreAt10B: number;
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

export interface DistributedAntiFabricationAudit {
  readonly overallPassed: boolean;
  readonly auditTimestamp: number;
  readonly checks: {
    readonly provenanceChainValid: boolean;
    readonly startingHashMatchesStep84: boolean;
    readonly continuousLedgerHashValid: boolean;
    readonly totalVerifiedTokens: number;
    readonly target10BMet: boolean;
    readonly weightMutationNormNonZero: boolean;
    readonly weightDeltaL2Norm: number;
    readonly lossMonotonicallyDecreased: boolean;
    readonly validationPerplexityReal: boolean;
    readonly physicalTelemetryVerified: boolean;
    readonly zeroShardingConservationValid: boolean;
    readonly crossNodeDedupVerified: boolean;
    readonly crashRecoveryBitwiseExact: boolean;
    readonly capabilityRegressionPreserved: boolean;
    readonly securityRegressionPreserved: boolean;
    readonly zeroHardcodingAuditPassed: boolean;
  };
  readonly auditSummary: string;
  readonly classification: ScientificClassification;
}

export interface TenBillionTrainingManifest {
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
  readonly milestones: Readonly<Record<TenBillionMilestone, 'VERIFIED' | 'PENDING' | 'NOT_EXECUTED'>>;
  readonly capabilityPillars: readonly DistributedPillarRegression[];
  readonly securityDefenses: readonly DistributedSecurityDefenseRegression[];
  readonly antiFabricationAudit: DistributedAntiFabricationAudit;
  readonly classification: ScientificClassification;
}
