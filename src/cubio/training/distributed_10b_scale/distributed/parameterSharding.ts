/**
 * CubiO — Step 85 ZeRO-3 Parameter Sharding
 * Partitions model weights across ranks and gathers them on-demand for forward/backward passes.
 */

import { ParameterShardMetadata } from '../types';
import { deterministicHash } from '../../../state/determinism';

export class ParameterSharding {
  private readonly worldSize: number;
  private readonly localRank: number;

  constructor(worldSize: number, localRank: number) {
    this.worldSize = worldSize;
    this.localRank = localRank;
  }

  /**
   * Partitions total weights array into N rank-owned contiguous slices.
   */
  public shardParameters(weights: readonly number[]): {
    localSlice: readonly number[];
    metadata: readonly ParameterShardMetadata[];
  } {
    const totalParams = weights.length;
    const sliceSize = Math.ceil(totalParams / this.worldSize);
    const metadata: ParameterShardMetadata[] = [];
    let localSlice: number[] = [];

    for (let r = 0; r < this.worldSize; r++) {
      const start = r * sliceSize;
      const end = Math.min(totalParams, start + sliceSize);
      const slice = weights.slice(start, end);
      const shardHash = deterministicHash(`PARAM_SHARD_R${r}_SIZE_${slice.length}_SUM_${slice.reduce((a, b) => a + b, 0)}`);

      metadata.push(
        Object.freeze({
          layerId: `shard_${r}`,
          paramCount: slice.length,
          ownerRank: r,
          startOffset: start,
          endOffset: end,
          shardHash,
        })
      );

      if (r === this.localRank) {
        localSlice = slice;
      }
    }

    return {
      localSlice: Object.freeze(localSlice),
      metadata: Object.freeze(metadata),
    };
  }

  /**
   * Simulates All-Gather reconstruction of full model parameters from all rank shards.
   */
  public allGatherParameters(allRankSlices: readonly (readonly number[])[]): readonly number[] {
    const fullWeights: number[] = [];
    for (const slice of allRankSlices) {
      fullWeights.push(...slice);
    }
    return Object.freeze(fullWeights);
  }
}
