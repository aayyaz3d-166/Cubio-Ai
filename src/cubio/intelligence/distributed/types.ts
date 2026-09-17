/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F18: CubiO Intelligence Distributed Core Engine (Types & Contracts)
 *
 * Master specification for multi-node distributed compute mesh,
 * dynamic load-balanced task dispatch, scatter-gather parallel execution,
 * and 369 harmonic quorum consensus state replication.
 */

import { CubiODimension } from '../../types';
import { CubiOState } from '../../state/types';
import {
  IntelligenceContextEnvelope,
  EngineExecutionResult,
  EngineCapability,
} from '../core/types';

export type ClusterNodeRole =
  | 'PRIMARY_LEADER'
  | 'WORKER_NODE'
  | 'EDGE_RELAY'
  | 'REPLICA_OBSERVER';

export type ClusterNodeStatus =
  | 'ONLINE'
  | 'BUSY'
  | 'DRAINING'
  | 'DEGRADED'
  | 'OFFLINE';

export type DistributedTaskType =
  | 'TENSOR_TRANSFORM'
  | 'REASONING_PROOF'
  | 'TRAJECTORY_PREDICTION'
  | 'STATE_SYNTHESIS'
  | 'MERKLE_REPLICATION';

export interface DistributedComputeNode {
  readonly nodeId: string;
  readonly clusterRole: ClusterNodeRole;
  readonly address: string;
  readonly supportedCapabilities: readonly EngineCapability[];
  readonly assignedDimensions: readonly CubiODimension[];
  readonly status: ClusterNodeStatus;
  readonly maxConcurrentSlots: number;
  readonly activeTasksCount: number;
  readonly completedTasksCount: number;
  readonly lastHeartbeatAt: number;
  readonly nodeLatencyMs: number;
}

export interface DistributedTask {
  readonly taskId: string;
  readonly taskType: DistributedTaskType;
  readonly envelope: IntelligenceContextEnvelope;
  readonly assignedNodeId?: string;
  readonly priority: number; // 1 (lowest) .. 10 (highest)
  readonly targetDimension?: CubiODimension;
  readonly requiredCapabilities?: readonly EngineCapability[];
  readonly status: 'QUEUED' | 'DISPATCHED' | 'COMPLETED' | 'FAILED' | 'RETRYING';
  readonly createdAt: number;
}

export interface DistributedTaskResult {
  readonly taskId: string;
  readonly nodeId: string;
  readonly success: boolean;
  readonly executionResult: EngineExecutionResult;
  readonly executionTimeMs: number;
  readonly taskChecksum: string;
}

export interface DistributedClusterTopology {
  readonly clusterId: string;
  readonly leaderNodeId: string;
  readonly totalNodes: number;
  readonly activeNodes: number;
  readonly totalSlots: number;
  readonly availableSlots: number;
  readonly averageClusterLatencyMs: number;
  readonly clusterChecksum: string;
}

export interface ReplicationSyncReport {
  readonly syncId: string;
  readonly stateId: string;
  readonly replicatedNodesCount: number;
  readonly totalClusterNodes: number;
  readonly quorumAchieved: boolean;
  readonly syncLatencyMs: number;
  readonly syncChecksum: string;
}
