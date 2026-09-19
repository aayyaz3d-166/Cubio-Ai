/**
 * CubiO — Step 86 Shard Reassignment Handler
 */

import { DistributedShardScheduler } from '../data/distributedShardScheduler';

export class ShardReassignment {
  public static handleNodeFailure(
    scheduler: DistributedShardScheduler,
    failedRank: number,
    activeRanks: readonly number[]
  ): void {
    scheduler.reassignShardsFromFailedRank(failedRank, activeRanks);
  }
}
