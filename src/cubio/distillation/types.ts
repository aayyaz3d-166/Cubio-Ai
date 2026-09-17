/**
 * CubiO — Universal Spatial Operating Environment
 * Phase 24: Step 18 Distributed Superposition Compute & Model Distillation Types
 *
 * Master specifications for:
 * - Candidate Partitioning Strategies (Round Robin, Resource Weighted, Memory Locality, Resonance Aware, Cost Aware, Hybrid)
 * - Distributed Superposition Workloads & Global Deterministic Reduction
 * - Distributed Multi-Branch Tree Search Coordination
 * - Multi-Node Experience Aggregation & DPO Preference Pair Extraction
 * - Parameter / Policy Synchronization & Checkpoint Distillation
 * - Scientific Resource Accounting & Metric Classification
 */

import { QuantizationFormat } from '../compute/quantization/types';
import { DistributedCandidate, DistributedSuperpositionEnvelope } from '../mesh/types';
import { CubiOState } from '../state/types';
import { EnvAction, EnvObservation, ReplayTransition } from '../learning/env/types';

// ─── 1. SCIENTIFIC CLASSIFICATION ───────────────────────────────────────────

export type ScientificClassification =
  | 'REAL_SOFTWARE_IMPLEMENTATION'
  | 'CPU_SIMULATION'
  | 'NETWORK_SIMULATION'
  | 'MEASURED_PHYSICAL_RESOURCE'
  | 'THEORETICAL_FUTURE_HARDWARE';

// ─── 2. PARTITIONING & SCHEDULING ───────────────────────────────────────────

export type PartitionStrategy =
  | 'ROUND_ROBIN'
  | 'RESOURCE_WEIGHTED'
  | 'MEMORY_LOCALITY'
  | 'RESONANCE_AWARE'
  | 'COST_AWARE'
  | 'HYBRID';

export interface NodeCandidatePartition {
  readonly nodeId: string;
  readonly candidates: readonly DistributedCandidate[];
  readonly allocatedVLanes: number;
  readonly estimatedMemoryBytes: number;
  readonly quantization: QuantizationFormat;
}

export interface LocalEvaluationResult {
  readonly nodeId: string;
  readonly evaluatedCandidates: readonly DistributedCandidate[];
  readonly winningLocalCandidate: DistributedCandidate;
  readonly evaluationDurationMs: number;
  readonly memoryUsedBytes: number;
  readonly quantizationErrorMAE: number;
}

export interface GlobalReductionResult {
  readonly globalEnvelope: DistributedSuperpositionEnvelope;
  readonly winningCandidate: DistributedCandidate;
  readonly totalProbability: number;
  readonly resonanceScore: number;
  readonly phaseCoherence: number;
  readonly entropy: number;
  readonly reductionDurationMs: number;
  readonly isDeterministic: boolean;
  readonly provenanceHash: string;
}

// ─── 3. DISTRIBUTED TREE SEARCH ─────────────────────────────────────────────

export interface DistributedTreeNode {
  readonly nodeId: string;
  readonly executingNodeId: string;
  readonly depth: number;
  readonly branchId: string;
  readonly state: CubiOState;
  readonly action: EnvAction;
  readonly reward: number;
  readonly visits: number;
  readonly value: number;
  readonly children: readonly DistributedTreeNode[];
}

export interface DistributedTreeSearchResult {
  readonly rootObservation: EnvObservation;
  readonly totalBranches: number;
  readonly participatingNodes: readonly string[];
  readonly selectedAction: EnvAction;
  readonly bestTrajectory: readonly DistributedTreeNode[];
  readonly searchDurationMs: number;
  readonly treeChecksum: string;
  readonly provenanceHash: string;
}

// ─── 4. MODEL & EXPERIENCE DISTILLATION ─────────────────────────────────────

export interface DPOPreferencePair {
  readonly pairId: string;
  readonly prompt: string;
  readonly chosenAction: EnvAction;
  readonly rejectedAction: EnvAction;
  readonly chosenReward: number;
  readonly rejectedReward: number;
  readonly resonanceAdvantage: number;
  readonly provenanceHash: string;
  readonly timestamp: number;
}

export type PolicySyncMode =
  | 'FULL_SYNC'
  | 'DELTA_SYNC'
  | 'CHECKPOINT_SYNC'
  | 'PERIODIC_DISTILLATION';

export interface PolicySyncPayload {
  readonly policyId: string;
  readonly modelVersion: number;
  readonly policyVersion: number;
  readonly syncMode: PolicySyncMode;
  readonly originNodeId: string;
  readonly parentVersion: number;
  readonly deltaChecksum: string;
  readonly weightsBlob?: readonly number[];
  readonly checkpointHash: string;
  readonly timestamp: number;
}

export interface DistillationMetrics {
  readonly totalExperiencesAggregated: number;
  readonly dpoPairsGenerated: number;
  readonly averageRewardAdvantage: number;
  readonly resonanceBoostRatio: number;
  readonly policyVersion: number;
  readonly provenanceHash: string;
}

// ─── 5. DISTRIBUTED RESOURCE METRICS ────────────────────────────────────────

export interface DistributedResourceMetrics {
  readonly logicalCandidatesCount: number;
  readonly physicalResidentRamBytes: number;
  readonly remoteStateBytes: number;
  readonly networkBytesTransferred: number;
  readonly vLaneUtilization: number;
  readonly microBatchesCount: number;
  readonly cacheHitRatio: number;
  readonly compressionRatio: number;
  readonly precision: QuantizationFormat;
  readonly quantizationErrorMAE: number;
  readonly executionLatencyMs: number;
  readonly reductionLatencyMs: number;
  readonly scientificClassification: ScientificClassification;
}
