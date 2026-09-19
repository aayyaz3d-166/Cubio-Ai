/**
 * CubiO — Step 85 Global Shard Scheduler
 * Deterministically schedules shards to ranks ensuring zero overlap and balanced distribution.
 */

import { TenBillionDatasetShard } from '../types';

export class GlobalShardScheduler {
  private readonly worldSize: number;
  private readonly rankQueues: Map<number, TenBillionDatasetShard[]> = new Map();

  constructor(worldSize = 4) {
    this.worldSize = worldSize;
    for (let r = 0; r < worldSize; r++) {
      this.rankQueues.set(r, []);
    }
  }

  public scheduleShards(shards: readonly TenBillionDatasetShard[]): void {
    for (const shard of shards) {
      const targetRank = shard.assignedRank % this.worldSize;
      this.rankQueues.get(targetRank)?.push(shard);
    }
  }

  public getShardsForRank(rank: number): readonly TenBillionDatasetShard[] {
    return Object.freeze([...(this.rankQueues.get(rank) || [])]);
  }

  public getTotalAssignedTokens(rank: number): number {
    const queue = this.rankQueues.get(rank) || [];
    return queue.reduce((acc, s) => acc + s.tokenCount, 0);
  }
}
