/**
 * CubiO — Step 85 Distributed Cluster Node Registry
 * Manages active nodes, ranks, hardware capabilities, and cluster state.
 */

import { ClusterNodeInfo, ClusterNodeRole, NodeStatusType } from '../types';
import { deterministicHash } from '../../../state/determinism';

export class NodeRegistry {
  private readonly nodes: Map<number, ClusterNodeInfo> = new Map();
  private readonly worldSize: number;

  constructor(worldSize = 4) {
    this.worldSize = worldSize;
    this.initializeDefaultCluster();
  }

  private initializeDefaultCluster(): void {
    for (let rank = 0; rank < this.worldSize; rank++) {
      const isCoord = rank === 0;
      const nodeId = `cubio-node-${rank}`;
      const authTokenHash = deterministicHash(`AUTH_SECRET_RANK_${rank}`);

      const node: ClusterNodeInfo = Object.freeze({
        nodeId,
        nodeRank: rank,
        worldSize: this.worldSize,
        role: isCoord ? 'COORDINATOR' : 'WORKER',
        hostname: `10.0.85.${10 + rank}`,
        port: 9850 + rank,
        cores: 64,
        totalMemoryBytes: 256 * 1024 * 1024 * 1024, // 256 GB
        status: 'READY',
        joinedAtTimestamp: Date.now() - 10000,
        lastHeartbeatTimestamp: Date.now(),
        authTokenHash,
      });

      this.nodes.set(rank, node);
    }
  }

  public getNode(rank: number): ClusterNodeInfo | undefined {
    return this.nodes.get(rank);
  }

  public getAllNodes(): readonly ClusterNodeInfo[] {
    return Array.from(this.nodes.values());
  }

  public getActiveRanks(): readonly number[] {
    return Array.from(this.nodes.keys()).filter((rank) => {
      const n = this.nodes.get(rank);
      return n && n.status !== 'OFFLINE';
    });
  }

  public updateNodeStatus(rank: number, status: NodeStatusType): void {
    const existing = this.nodes.get(rank);
    if (!existing) return;
    this.nodes.set(
      rank,
      Object.freeze({
        ...existing,
        status,
        lastHeartbeatTimestamp: Date.now(),
      })
    );
  }

  public registerHeartbeat(rank: number): void {
    const existing = this.nodes.get(rank);
    if (!existing) return;
    this.nodes.set(
      rank,
      Object.freeze({
        ...existing,
        lastHeartbeatTimestamp: Date.now(),
      })
    );
  }

  public getWorldSize(): number {
    return this.worldSize;
  }
}
