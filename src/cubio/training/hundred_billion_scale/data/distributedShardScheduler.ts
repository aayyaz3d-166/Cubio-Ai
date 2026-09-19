/**
 * CubiO — Step 86 Distributed Shard Scheduler
 */

import { HundredBillionDatasetShard } from '../types';

export class DistributedShardScheduler {
  private readonly worldSize: number;
  private readonly rankQueues: Map<number, HundredBillionDatasetShard[]> = new Map();

  constructor(worldSize = 6) {
    this.worldSize = worldSize;
    for (let r = 0; r < worldSize; r++) {
      this.rankQueues.set(r, []);
    }
  }

  public scheduleShards(shards: readonly HundredBillionDatasetShard[]): void {
    for (const shard of shards) {
      const targetRank = shard.assignedRank % this.worldSize;
      this.rankQueues.get(targetRank)?.push(shard);
    }
  }

  public getShardsForRank(rank: number): readonly HundredBillionDatasetShard[] {
    return Object.freeze([...(this.rankQueues.get(rank) || [])]);
  }

  public reassignShardsFromFailedRank(failedRank: number, activeRanks: readonly number[]): void {
    const orphaned = this.rankQueues.get(failedRank) || [];
    this.rankQueues.set(failedRank, []);

    orphaned.forEach((shard, idx) => {
      const newRank = activeRanks[idx % activeRanks.length];
      this.rankQueues.get(newRank)?.push(shard);
    });
  }
}
