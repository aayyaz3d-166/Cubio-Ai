/**
 * CubiO — Universal Spatial Operating Environment
 * Phase 23: Step 17 Multi-Node Collaborative Superposition Mesh Types
 *
 * Master contracts for:
 * - Node Identity, Capabilities, and Resource Profiles
 * - Hardware-Agnostic Mesh Transport & Message Contracts
 * - Content-Addressed State Delta Exchange & Duplicate Suppression
 * - Multi-Node Distributed Superposition Envelopes & Deterministic Collapse
 * - Remote Virtual Memory Page Descriptors & Locality Tracking
 * - Distributed vLane Scheduling & Cost-Aware Execution Decisions
 * - Multi-Node Checkpoints & Merkle Provenance
 */

import { QuantizationFormat } from '../compute/quantization/types';
import { RuntimeProfileName } from '../runtime/unified/types';
import { CubiOState } from '../state/types';
import { EnvAction } from '../learning/env/types';

// ─── 1. NODE IDENTITY & CAPABILITY PROFILES ─────────────────────────────────

export interface NodeIdentity {
  readonly nodeId: string;
  readonly clusterId: string;
  readonly endpointUri: string;
  readonly registeredAt: number;
}

export interface NodeCapabilities {
  readonly cpuCores: number;
  readonly physicalRamBytes: number;
  readonly ramBudgetBytes: number;
  readonly gpuAvailable: boolean;
  readonly vramBytes?: number;
  readonly supportedQuantizations: readonly QuantizationFormat[];
  readonly vLaneCapacity: number;
  readonly casCapacityBytes: number;
  readonly runtimeProfile: RuntimeProfileName;
}

export interface NodeResourceProfile {
  readonly identity: NodeIdentity;
  readonly capabilities: NodeCapabilities;
  readonly currentResidentBytes: number;
  readonly activeVLanes: number;
  readonly healthStatus: 'HEALTHY' | 'DEGRADED' | 'OFFLINE';
  readonly lastHeartbeatTimestamp: number;
}

// ─── 2. MESH MESSAGING & PROTOCOLS ──────────────────────────────────────────

export type MeshMessageType =
  | 'HEARTBEAT'
  | 'STATE_DELTA'
  | 'SUPERPOSITION_CANDIDATES'
  | 'REMOTE_PAGE_REQUEST'
  | 'REMOTE_PAGE_RESPONSE'
  | 'WORK_UNIT_DISPATCH'
  | 'WORK_UNIT_RESULT'
  | 'CHECKPOINT_SYNC';

export interface MeshMessage<T = any> {
  readonly messageId: string;
  readonly senderNodeId: string;
  readonly recipientNodeId: string; // Specific nodeId or '*' for broadcast
  readonly messageType: MeshMessageType;
  readonly payload: T;
  readonly checksum: string;
  readonly provenanceHash: string;
  readonly timestamp: number;
}

// ─── 3. STATE DELTA EXCHANGE & CAS PROTOCOL ─────────────────────────────────

export interface StateDeltaPayload {
  readonly deltaId: string;
  readonly rootStateId: string;
  readonly parentDeltaId: string | null;
  readonly positionDelta?: readonly number[];
  readonly propertyChanges?: Readonly<Record<string, any>>;
  readonly removedPropertyKeys?: readonly string[];
  readonly checksum: string;
  readonly cid?: string;
  readonly rawStateBytes?: readonly number[];
}

// ─── 4. DISTRIBUTED SUPERPOSITION MESH ──────────────────────────────────────

export interface DistributedCandidate {
  readonly candidateId: string;
  readonly owningNodeId: string;
  readonly stateChecksum: string;
  readonly probability: number;
  readonly amplitude: number;
  readonly resonanceScore: number;
  readonly storageLocation: 'RESIDENT_RAM' | 'LOCAL_CAS' | 'REMOTE_NODE';
  readonly action?: EnvAction;
  readonly state?: CubiOState;
}

export interface DistributedSuperpositionEnvelope {
  readonly distributedSuperpositionId: string;
  readonly primaryCandidateId: string;
  readonly totalCandidatesCount: number;
  readonly candidates: readonly DistributedCandidate[];
  readonly totalProbability: number;
  readonly envelopeChecksum: string;
  readonly isCollapsed: boolean;
  readonly collapsedCandidateId?: string;
}

// ─── 5. REMOTE VIRTUAL MEMORY & PAGE DESCRIPTORS ────────────────────────────

export interface RemotePageDescriptor {
  readonly blockId: string;
  readonly owningNodeId: string;
  readonly replicaNodeIds: readonly string[];
  readonly storageLocation: 'RESIDENT_RAM' | 'CACHE' | 'LOCAL_CAS' | 'REMOTE_CAS' | 'REMOTE_NODE';
  readonly byteSize: number;
  readonly checksum: string;
  readonly isResidentLocally: boolean;
}

export interface RemotePageRequestPayload {
  readonly blockId: string;
  readonly requestingNodeId: string;
}

export interface RemotePageResponsePayload {
  readonly blockId: string;
  readonly dataHex: string;
  readonly byteLength: number;
  readonly checksum: string;
}

// ─── 6. DISTRIBUTED VLANE WORKLOADS & SCHEDULING ────────────────────────────

export type MeshDistributedTaskType =
  | 'SPECULATIVE_EVAL'
  | 'TREE_SEARCH'
  | 'QUANTIZED_MATMUL'
  | 'STATE_TRANSITION';

export interface DistributedWorkUnit {
  readonly workUnitId: string;
  readonly taskType: MeshDistributedTaskType;
  readonly sourceNodeId: string;
  readonly targetNodeId: string;
  readonly payload: any;
  readonly status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  readonly priority: number;
  readonly createdAt: number;
  readonly completedAt?: number;
  readonly result?: any;
  readonly error?: string;
}

export type MeshSchedulingAction =
  | 'LOCAL_EXECUTION'
  | 'REMOTE_EXECUTION'
  | 'MICRO_BATCH'
  | 'DEFER'
  | 'PREFETCH';

export interface MeshSchedulingDecision {
  readonly decision: MeshSchedulingAction;
  readonly assignedNodeId: string;
  readonly estimatedCost: number;
  readonly reason: string;
}

// ─── 7. DISTRIBUTED CHECKPOINT & CLUSTER METRICS ────────────────────────────

export interface DistributedCheckpoint {
  readonly checkpointId: string;
  readonly clusterId: string;
  readonly nodeCheckpoints: Readonly<Record<string, string>>; // nodeId -> checkpointId
  readonly merkleRootHash: string;
  readonly timestamp: number;
}

export interface MeshClusterMetrics {
  readonly totalNodesCount: number;
  readonly healthyNodesCount: number;
  readonly totalLogicalVLanes: number;
  readonly totalLogicalStates: number;
  readonly totalCasStorageBytes: number;
  readonly totalResidentRamBytes: number;
  readonly clusterDeduplicationRatio: number;
  readonly messagesTransferredCount: number;
  readonly bytesTransferredCount: number;
  readonly duplicateSuppressedCount: number;
  readonly provenanceHash: string;
}
