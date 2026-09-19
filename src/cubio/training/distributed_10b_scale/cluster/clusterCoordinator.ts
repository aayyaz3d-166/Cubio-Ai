/**
 * CubiO — Step 85 Master Distributed Cluster Coordinator
 * Master orchestrator for node registration, health auditing, and rendezvous synchronization.
 */

import { NodeRegistry } from './nodeRegistry';
import { NodeHealthMonitor } from './nodeHealthMonitor';
import { RendezvousManager } from './rendezvousManager';
import { DistributedWorker } from './distributedWorker';
import { ClusterNodeInfo } from '../types';

export class ClusterCoordinator {
  public readonly registry: NodeRegistry;
  public readonly healthMonitor: NodeHealthMonitor;
  public readonly rendezvous: RendezvousManager;
  public readonly workers: Map<number, DistributedWorker> = new Map();
  public readonly worldSize: number;

  constructor(worldSize = 4) {
    this.worldSize = worldSize;
    this.registry = new NodeRegistry(worldSize);
    this.healthMonitor = new NodeHealthMonitor(this.registry);
    this.rendezvous = new RendezvousManager(worldSize);

    // Initialize worker representations
    for (let r = 0; r < worldSize; r++) {
      const node = this.registry.getNode(r)!;
      this.workers.set(r, new DistributedWorker(node));
    }
  }

  public getCoordinatorNode(): ClusterNodeInfo {
    return this.registry.getNode(0)!;
  }

  public getWorker(rank: number): DistributedWorker | undefined {
    return this.workers.get(rank);
  }

  public synchronizeBarrier(barrierName: string, epoch: number, step: number): boolean {
    for (let r = 0; r < this.worldSize; r++) {
      this.rendezvous.arrive(barrierName, r, epoch, step);
    }
    return this.rendezvous.isBarrierUnlocked(barrierName);
  }
}
