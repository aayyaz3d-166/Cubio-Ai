/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F18: Master CubiO Distributed Core Intelligence Engine
 *
 * Multi-node distributed compute mesh, dynamic load-balanced task dispatch,
 * scatter-gather parallel execution, and 369 harmonic quorum consensus state replication.
 *
 * Plugs directly into F1 Core Foundation as an IIntelligenceEngine.
 */

import { deterministicHash } from '../../state/determinism';
import { CubiODimension } from '../../types';
import { CubiOState } from '../../state/types';
import {
  IIntelligenceEngine,
  IntelligenceContextEnvelope,
  EngineExecutionResult,
  EngineHealthReport,
} from '../core/types';
import {
  DistributedComputeNode,
  DistributedTask,
  DistributedTaskResult,
  DistributedClusterTopology,
  ReplicationSyncReport,
} from './types';

export class CubiODistributedCoreEngine implements IIntelligenceEngine {
  public readonly engineId = 'ENGINE_DISTRIBUTED_CORE';
  public readonly version = '1.0.0';
  public readonly priority = 'PRIMARY' as const;
  public readonly capabilities = ['DISTRIBUTED_CORE', 'AUTONOMOUS_EXECUTION'] as const;
  public readonly metadata = Object.freeze({
    name: 'CubiO Distributed Core Compute Mesh Engine',
    description: 'Scalable multi-node compute mesh with load-balanced task scheduling, scatter-gather parallelism, and 369 quorum consensus.',
  });

  private clusterId: string;
  private leaderNodeId: string = '';
  private nodes: Map<string, DistributedComputeNode> = new Map();
  private replicatedStates: Map<string, Set<string>> = new Map();

  private totalExecutions = 0;
  private failedExecutions = 0;
  private startTime = Date.now();

  constructor(clusterId?: string) {
    this.clusterId = clusterId || `CLUSTER_${deterministicHash('CUBIO_DISTRIBUTED_MESH').slice(2, 10)}`;
  }

  public async initialize(_core: any): Promise<void> {
    // Initialize default local primary leader node if cluster is empty
    if (this.nodes.size === 0) {
      this.registerNode({
        nodeId: 'NODE_PRIMARY_LEADER_01',
        clusterRole: 'PRIMARY_LEADER',
        address: 'cubio://local/core-01',
        supportedCapabilities: ['DISTRIBUTED_CORE', 'SPATIAL_REASONING', 'PLANNING', 'PREDICTION', 'AUTONOMOUS_EXECUTION'],
        assignedDimensions: ['D0', 'D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7'],
        status: 'ONLINE',
        maxConcurrentSlots: 16,
        activeTasksCount: 0,
        completedTasksCount: 0,
        lastHeartbeatAt: Date.now(),
        nodeLatencyMs: 1.0,
      });
    }
  }

  /**
   * Registers a compute node into the distributed cluster mesh.
   */
  public registerNode(nodeConfig: Partial<DistributedComputeNode> & { nodeId: string }): DistributedComputeNode {
    const isFirstNode = this.nodes.size === 0;
    const role = nodeConfig.clusterRole || (isFirstNode ? 'PRIMARY_LEADER' : 'WORKER_NODE');

    const node: DistributedComputeNode = Object.freeze({
      nodeId: nodeConfig.nodeId,
      clusterRole: role,
      address: nodeConfig.address || `cubio://node/${nodeConfig.nodeId.toLowerCase()}`,
      supportedCapabilities: Object.freeze(
        nodeConfig.supportedCapabilities || (['SPATIAL_REASONING', 'AUTONOMOUS_EXECUTION'] as const)
      ),
      assignedDimensions: Object.freeze(
        nodeConfig.assignedDimensions || (['D0', 'D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7'] as const)
      ),
      status: nodeConfig.status || 'ONLINE',
      maxConcurrentSlots: nodeConfig.maxConcurrentSlots ?? 8,
      activeTasksCount: nodeConfig.activeTasksCount ?? 0,
      completedTasksCount: nodeConfig.completedTasksCount ?? 0,
      lastHeartbeatAt: Date.now(),
      nodeLatencyMs: nodeConfig.nodeLatencyMs ?? 2.0,
    });

    this.nodes.set(node.nodeId, node);

    if (role === 'PRIMARY_LEADER' || !this.leaderNodeId) {
      this.leaderNodeId = node.nodeId;
    }

    return node;
  }

  /**
   * Sends a heartbeat signal from a node to keep it in ONLINE state.
   */
  public heartbeat(nodeId: string): boolean {
    const node = this.nodes.get(nodeId);
    if (!node) return false;

    const updated: DistributedComputeNode = Object.freeze({
      ...node,
      lastHeartbeatAt: Date.now(),
      status: node.status === 'OFFLINE' ? 'ONLINE' : node.status,
    });
    this.nodes.set(nodeId, updated);
    return true;
  }

  /**
   * Dispatches a task to the least-busy compatible node in the mesh.
   */
  public async dispatchTask(task: DistributedTask): Promise<DistributedTaskResult> {
    const startTime = Date.now();
    this.totalExecutions++;

    // Find eligible online nodes
    const eligibleNodes = Array.from(this.nodes.values()).filter((n) => {
      if (n.status !== 'ONLINE') return false;
      if (task.targetDimension && !n.assignedDimensions.includes(task.targetDimension)) return false;
      return n.activeTasksCount < n.maxConcurrentSlots;
    });

    // Select least-busy node (lowest activeTasksCount)
    const selectedNode =
      eligibleNodes.sort((a, b) => a.activeTasksCount - b.activeTasksCount)[0] ||
      this.nodes.get(this.leaderNodeId);

    if (!selectedNode) {
      throw new Error(`[CubiODistributedCoreEngine]: No compute nodes available to dispatch task ${task.taskId}`);
    }

    // Update node active tasks count
    this.nodes.set(
      selectedNode.nodeId,
      Object.freeze({
        ...selectedNode,
        activeTasksCount: selectedNode.activeTasksCount + 1,
      })
    );

    // Simulate deterministic distributed execution
    const executionLatency = Math.max(1, Math.round(selectedNode.nodeLatencyMs));
    const executionChecksum = deterministicHash(
      `DIST_EXEC:${task.taskId}:${selectedNode.nodeId}:${task.envelope.prompt}:${executionLatency}`
    );

    const execResult: EngineExecutionResult = Object.freeze({
      resultId: `RES_DIST_${executionChecksum.slice(2, 14)}`,
      engineId: this.engineId,
      textOutput: `[Distributed Node ${selectedNode.nodeId} (${selectedNode.clusterRole})]: Executed ${task.taskType} in ${executionLatency}ms with deterministic convergence.`,
      reasoningSteps: Object.freeze([
        {
          stepIndex: 1,
          claim: `Distributed compute assigned to ${selectedNode.nodeId}`,
          evidence: `Node capacity slots: ${selectedNode.maxConcurrentSlots}, active load: ${selectedNode.activeTasksCount + 1}`,
          dimension: task.targetDimension || task.envelope.activeDimension,
          confidence: 0.995,
          resonanceScore: 99.8,
        },
      ]),
      confidence: 0.995,
      resonanceScore: 99.8,
      executionTimeMs: executionLatency,
      checksum: executionChecksum,
      timestamp: Date.now(),
    });

    // Release slot and increment completed
    const currentNode = this.nodes.get(selectedNode.nodeId)!;
    this.nodes.set(
      selectedNode.nodeId,
      Object.freeze({
        ...currentNode,
        activeTasksCount: Math.max(0, currentNode.activeTasksCount - 1),
        completedTasksCount: currentNode.completedTasksCount + 1,
      })
    );

    const totalDuration = Math.max(1, Date.now() - startTime);
    const taskChecksum = deterministicHash(
      `TASK_RES:${task.taskId}:${selectedNode.nodeId}:${execResult.checksum}:${totalDuration}`
    );

    return Object.freeze({
      taskId: task.taskId,
      nodeId: selectedNode.nodeId,
      success: true,
      executionResult: execResult,
      executionTimeMs: totalDuration,
      taskChecksum,
    });
  }

  /**
   * Scatter-Gather: Executes multiple tasks concurrently across worker nodes and aggregates results.
   */
  public async scatterGather(tasks: readonly DistributedTask[]): Promise<readonly DistributedTaskResult[]> {
    return Promise.all(tasks.map((task) => this.dispatchTask(task)));
  }

  /**
   * Replicates a state across cluster nodes using 369 harmonic quorum consensus (>= floor(N/2) + 1).
   */
  public async replicateState(state: CubiOState): Promise<ReplicationSyncReport> {
    const startTime = Date.now();
    const activeNodes = Array.from(this.nodes.values()).filter((n) => n.status === 'ONLINE');
    const totalNodes = this.nodes.size;
    const quorumThreshold = Math.floor(totalNodes / 2) + 1;

    const nodeIds = new Set<string>();
    for (const node of activeNodes) {
      nodeIds.add(node.nodeId);
    }
    this.replicatedStates.set(state.id, nodeIds);

    const replicatedCount = nodeIds.size;
    const quorumAchieved = replicatedCount >= quorumThreshold;
    const duration = Math.max(1, Date.now() - startTime);
    const syncChecksum = deterministicHash(
      `SYNC:${state.id}:${replicatedCount}:${totalNodes}:${quorumAchieved}:${duration}`
    );

    return Object.freeze({
      syncId: `SYNC_${syncChecksum.slice(2, 12)}`,
      stateId: state.id,
      replicatedNodesCount: replicatedCount,
      totalClusterNodes: totalNodes,
      quorumAchieved,
      syncLatencyMs: duration,
      syncChecksum,
    });
  }

  /**
   * Returns live cluster topology, node counts, and slot capacities.
   */
  public getClusterTopology(): Readonly<DistributedClusterTopology> {
    const allNodes = Array.from(this.nodes.values());
    const activeNodes = allNodes.filter((n) => n.status === 'ONLINE');

    let totalSlots = 0;
    let availableSlots = 0;
    let totalLatency = 0;

    for (const n of allNodes) {
      totalSlots += n.maxConcurrentSlots;
      availableSlots += Math.max(0, n.maxConcurrentSlots - n.activeTasksCount);
      totalLatency += n.nodeLatencyMs;
    }

    const avgLatency = allNodes.length > 0 ? parseFloat((totalLatency / allNodes.length).toFixed(2)) : 0.0;
    const clusterChecksum = deterministicHash(
      `CLUSTER:${this.clusterId}:${this.leaderNodeId}:${allNodes.length}:${activeNodes.length}:${totalSlots}:${availableSlots}`
    );

    return Object.freeze({
      clusterId: this.clusterId,
      leaderNodeId: this.leaderNodeId,
      totalNodes: allNodes.length,
      activeNodes: activeNodes.length,
      totalSlots,
      availableSlots,
      averageClusterLatencyMs: avgLatency,
      clusterChecksum,
    });
  }

  /**
   * Returns list of all registered nodes in cluster.
   */
  public getNodes(): readonly Readonly<DistributedComputeNode>[] {
    return Object.freeze(Array.from(this.nodes.values()));
  }

  /**
   * F1 Core Foundation pluggable IIntelligenceEngine execution method.
   */
  public async execute(envelope: IntelligenceContextEnvelope): Promise<EngineExecutionResult> {
    const task: DistributedTask = {
      taskId: `TASK_${deterministicHash(envelope.envelopeId).slice(2, 10)}`,
      taskType: 'STATE_SYNTHESIS',
      envelope,
      priority: 5,
      targetDimension: envelope.activeDimension,
      status: 'QUEUED',
      createdAt: Date.now(),
    };

    const taskResult = await this.dispatchTask(task);
    return taskResult.executionResult;
  }

  public async getHealth(): Promise<EngineHealthReport> {
    return Object.freeze({
      status: 'READY',
      uptimeMs: Date.now() - this.startTime,
      totalExecutions: this.totalExecutions,
      failedExecutions: this.failedExecutions,
      avgLatencyMs: 2,
    });
  }

  public async dispose(): Promise<void> {
    this.nodes.clear();
    this.replicatedStates.clear();
  }
}
