/**
 * CubiO — Step 86 ZeRO-3 Parameter Shard
 */

import { ParameterShardMetadata } from '../types';
import { deterministicHash } from '../../../state/determinism';

export class Zero3ParameterShard {
  private readonly worldSize: number;
  private readonly localRank: number;

  constructor(worldSize = 6, localRank = 0) {
    this.worldSize = worldSize;
    this.localRank = localRank;
  }

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
          layerId: `param_shard_${r}`,
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
}
