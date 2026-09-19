/**
 * CubiO — Step 86 6-Node Distributed Cluster Node Registry
 */

import { ClusterNodeInfo, NodeStatusType } from '../types';
import { deterministicHash } from '../../../state/determinism';

export class NodeRegistry {
  private readonly nodes: Map<number, ClusterNodeInfo> = new Map();
  private readonly worldSize: number;

  constructor(worldSize = 6) {
    this.worldSize = worldSize;
    this.initializeDefaultCluster();
  }

  private initializeDefaultCluster(): void {
    for (let rank = 0; rank < this.worldSize; rank++) {
      const isCoord = rank === 0;
      const nodeId = `cubio-node-${rank}`;
      const authTokenHash = deterministicHash(`AUTH_SECRET_STEP86_RANK_${rank}`);

      const node: ClusterNodeInfo = Object.freeze({
        nodeId,
        nodeRank: rank,
        worldSize: this.worldSize,
        role: isCoord ? 'COORDINATOR' : 'WORKER',
        hostname: `10.0.86.${10 + rank}`,
        port: 9860 + rank,
        cores: 128,
        totalMemoryBytes: 512 * 1024 * 1024 * 1024, // 512 GB
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
