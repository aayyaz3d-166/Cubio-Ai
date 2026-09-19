/**
 * CubiO — Step 85 Cluster Resource Ledger
 * Aggregates cluster resources, network statistics, throughput, and energy records.
 */

import { ClusterResourceSnapshot } from '../types';
import { NodeTelemetryCollector } from './nodeTelemetry';
import { NetworkTelemetryCollector } from './networkTelemetry';
import { ThroughputTelemetry } from './throughputTelemetry';
import { EnergyLedger } from './energyLedger';

export class ClusterResourceLedger {
  public readonly networkCollector: NetworkTelemetryCollector;
  private readonly snapshots: ClusterResourceSnapshot[] = [];
  private readonly worldSize: number;

  constructor(worldSize = 4) {
    this.worldSize = worldSize;
    this.networkCollector = new NetworkTelemetryCollector();
  }

  public recordSnapshot(totalTokens: number, durationMs: number, hasPhysicalPowerSensor = false): ClusterResourceSnapshot {
    const nodeTelemetries = [];
    let totalRSS = 0;
    let totalHeap = 0;

    for (let r = 0; r < this.worldSize; r++) {
      const telem = NodeTelemetryCollector.collectLocalTelemetry(`cubio-node-${r}`, r, totalTokens / (durationMs / 1000));
      nodeTelemetries.push(telem);
      totalRSS += telem.processRssBytes;
      totalHeap += telem.heapUsedBytes;
    }

    const tps = ThroughputTelemetry.computeThroughput(totalTokens, durationMs);
    const scalingEff = ThroughputTelemetry.computeScalingEfficiency(tps / this.worldSize, tps, this.worldSize);
    const netStats = this.networkCollector.getStats(this.worldSize);
    const energy = EnergyLedger.measureEnergy(durationMs / 1000, this.worldSize, hasPhysicalPowerSensor);

    const snapshot: ClusterResourceSnapshot = Object.freeze({
      timestamp: Date.now(),
      activeNodesCount: this.worldSize,
      totalProcessRSSBytes: totalRSS,
      totalHeapUsedBytes: totalHeap,
      aggregateTokensPerSec: tps,
      clusterScalingEfficiencyPercent: scalingEff,
      totalNetworkTransferredBytes: netStats.totalBytesTransferred,
      energyStatus: energy.status,
      estimatedEnergyJoules: energy.totalJoules,
    });

    this.snapshots.push(snapshot);
    return snapshot;
  }

  public getSnapshots(): readonly ClusterResourceSnapshot[] {
    return Object.freeze([...this.snapshots]);
  }
}
