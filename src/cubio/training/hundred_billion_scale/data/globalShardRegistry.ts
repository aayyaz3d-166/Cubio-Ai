/**
 * CubiO — Step 86 Global Shard Registry
 */

import { HundredBillionDatasetShard } from '../types';

export class GlobalShardRegistry {
  private readonly registry: Map<string, HundredBillionDatasetShard> = new Map();

  public registerShards(shards: readonly HundredBillionDatasetShard[]): void {
    for (const shard of shards) {
      this.registry.set(shard.shardId, shard);
    }
  }

  public getShard(shardId: string): HundredBillionDatasetShard | undefined {
    return this.registry.get(shardId);
  }

  public getAllShards(): readonly HundredBillionDatasetShard[] {
    return Array.from(this.registry.values());
  }
}
