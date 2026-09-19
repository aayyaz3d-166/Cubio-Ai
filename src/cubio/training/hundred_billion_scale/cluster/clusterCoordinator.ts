/**
 * CubiO — Step 86 Master Distributed Cluster Coordinator
 */

import { NodeRegistry } from './nodeRegistry';
import { HeartbeatMonitor } from './heartbeatMonitor';
import { RendezvousManager } from './rendezvousManager';
import { TopologyManager } from './topologyManager';
import { NodeFailureDetector } from './nodeFailureDetector';
import { ClusterNodeInfo } from '../types';

export class ClusterCoordinator {
  public readonly registry: NodeRegistry;
  public readonly heartbeatMonitor: HeartbeatMonitor;
  public readonly rendezvous: RendezvousManager;
  public readonly topology: TopologyManager;
  public readonly failureDetector: NodeFailureDetector;
  public readonly worldSize: number;

  constructor(worldSize = 6) {
    this.worldSize = worldSize;
    this.registry = new NodeRegistry(worldSize);
    this.heartbeatMonitor = new HeartbeatMonitor(this.registry);
    this.rendezvous = new RendezvousManager(worldSize);
    this.topology = new TopologyManager(worldSize);
    this.failureDetector = new NodeFailureDetector(this.registry, this.heartbeatMonitor);
  }

  public getCoordinatorNode(): ClusterNodeInfo {
    return this.registry.getNode(0)!;
  }

  public synchronizeBarrier(barrierName: string, epoch: number, step: number): boolean {
    for (let r = 0; r < this.worldSize; r++) {
      this.rendezvous.arrive(barrierName, r, epoch, step);
    }
    return this.rendezvous.isBarrierUnlocked(barrierName);
  }
}
