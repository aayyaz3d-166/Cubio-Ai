/**
 * CubiO — Step 85 Distributed Cluster Rendezvous Manager
 * Implements deterministic barrier synchronization and epoch synchronization.
 */

import { RendezvousBarrierState } from '../types';

export class RendezvousManager {
  private readonly worldSize: number;
  private readonly barriers: Map<string, { arrivedRanks: Set<number>; epoch: number; step: number; openedAt?: number }> = new Map();

  constructor(worldSize = 4) {
    this.worldSize = worldSize;
  }

  public arrive(barrierId: string, rank: number, epoch: number, step: number): RendezvousBarrierState {
    let barrier = this.barriers.get(barrierId);
    if (!barrier) {
      barrier = {
        arrivedRanks: new Set<number>(),
        epoch,
        step,
      };
      this.barriers.set(barrierId, barrier);
    }

    barrier.arrivedRanks.add(rank);
    const isUnlocked = barrier.arrivedRanks.size >= this.worldSize;
    if (isUnlocked && !barrier.openedAt) {
      barrier.openedAt = Date.now();
    }

    return Object.freeze({
      barrierId,
      epoch,
      step,
      requiredRanks: this.worldSize,
      arrivedRanks: Array.from(barrier.arrivedRanks).sort((a, b) => a - b),
      isUnlocked,
      timeoutMs: 30000,
      openedAtTimestamp: barrier.openedAt,
    });
  }

  public isBarrierUnlocked(barrierId: string): boolean {
    const barrier = this.barriers.get(barrierId);
    if (!barrier) return false;
    return barrier.arrivedRanks.size >= this.worldSize;
  }

  public resetBarrier(barrierId: string): void {
    this.barriers.delete(barrierId);
  }
}
