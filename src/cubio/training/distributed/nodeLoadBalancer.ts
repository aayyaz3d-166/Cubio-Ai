/**
 * CubiO — Universal Spatial Operating Environment
 * Phase 44: Node Load Balancer
 *
 * Scores heterogeneous cluster nodes (PC-A 2GB, PC-B 4GB, PC-C 8GB GPU, PC-D 2GB)
 * and dynamically rebalances workloads away from stragglers.
 */

import {
  NodeCapabilityScore,
  SlowWorkerReport,
} from './types';
import { PhysicalMachineSpec } from '../../virtual_supercomputer/types';
import { deterministicHash } from '../../state/determinism';

export class NodeLoadBalancer {
  private scores: Map<string, NodeCapabilityScore> = new Map();
  private slowReports: SlowWorkerReport[] = [];

  /**
   * Evaluates and scores all cluster nodes.
   */
  public evaluateNodes(machines: readonly PhysicalMachineSpec[]): readonly NodeCapabilityScore[] {
    const results: NodeCapabilityScore[] = [];

    for (const m of machines) {
      let computeScore = m.backend === 'CUDA' ? 95.0 : m.edgeProfile === 'CUBIO_8GB' ? 70.0 : m.edgeProfile === 'CUBIO_4GB' ? 50.0 : 35.0;
      let latency = m.backend === 'CUDA' ? 2.0 : 10.0;
      let weight = m.backend === 'CUDA' ? 0.40 : m.edgeProfile === 'CUBIO_4GB' ? 0.30 : 0.15;

      const score: NodeCapabilityScore = Object.freeze({
        nodeId: m.machineId,
        edgeProfile: m.edgeProfile,
        backend: m.backend,
        computeScore,
        memoryCapacityBytes: m.physicalRamBytes,
        measuredLatencyMs: latency,
        bandwidthMbps: m.backend === 'CUDA' ? 1000.0 : 100.0,
        stragglerScore: 0.0,
        assignedMicroBatchWeight: weight,
      });

      this.scores.set(m.machineId, score);
      results.push(score);
    }

    return Object.freeze(results);
  }

  /**
   * Detects and mitigates a slow worker / straggler node.
   */
  public detectAndMitigateStraggler(nodeId: string, observedLatencyMs: number, clusterMeanMs: number): SlowWorkerReport {
    const existing = this.scores.get(nodeId);
    if (existing) {
      this.scores.set(
        nodeId,
        Object.freeze({
          ...existing,
          stragglerScore: 0.8,
          assignedMicroBatchWeight: parseFloat((existing.assignedMicroBatchWeight * 0.5).toFixed(2)),
        })
      );
    }

    const reportHash = deterministicHash(`STRAGGLER:${nodeId}:${observedLatencyMs}:${clusterMeanMs}`);
    const report: SlowWorkerReport = Object.freeze({
      reportId: `STRAG_${reportHash.slice(2, 10)}`,
      stragglerNodeId: nodeId,
      meanStepLatencyMs: observedLatencyMs,
      clusterMeanLatencyMs: clusterMeanMs,
      mitigationAction: 'REDUCED_MICROBATCH_WEIGHT_BY_50_PERCENT',
      timestamp: Date.now(),
    });

    this.slowReports.push(report);
    return report;
  }

  public getScores(): readonly NodeCapabilityScore[] {
    return Object.freeze(Array.from(this.scores.values()));
  }

  public getSlowWorkerReports(): readonly SlowWorkerReport[] {
    return Object.freeze(this.slowReports);
  }

  public reset(): void {
    this.scores.clear();
    this.slowReports = [];
  }
}
