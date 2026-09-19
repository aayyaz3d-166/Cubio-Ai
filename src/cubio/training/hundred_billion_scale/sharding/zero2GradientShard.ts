/**
 * CubiO — Step 86 ZeRO-2 Gradient Shard
 */

import { GradientShardMetadata } from '../types';
import { deterministicHash } from '../../../state/determinism';

export class Zero2GradientShard {
  private readonly worldSize: number;
  private readonly localRank: number;

  constructor(worldSize = 6, localRank = 0) {
    this.worldSize = worldSize;
    this.localRank = localRank;
  }

  public reduceScatter(allRankGradients: readonly (readonly number[])[]): {
    localReducedGradients: readonly number[];
    metadata: readonly GradientShardMetadata[];
  } {
    const totalParams = allRankGradients[0]?.length || 0;
    const sliceSize = Math.ceil(totalParams / this.worldSize);
    const metadata: GradientShardMetadata[] = [];
    let localReduced: number[] = [];

    for (let r = 0; r < this.worldSize; r++) {
      const start = r * sliceSize;
      const end = Math.min(totalParams, start + sliceSize);
      const shardGradients: number[] = [];

      for (let i = start; i < end; i++) {
        let sum = 0;
        for (let rankIdx = 0; rankIdx < this.worldSize; rankIdx++) {
          sum += allRankGradients[rankIdx][i] || 0;
        }
        shardGradients.push(sum / this.worldSize);
      }

      const gradNorm = Math.sqrt(shardGradients.reduce((acc, g) => acc + g * g, 0));
      const shardHash = deterministicHash(`GRAD_SHARD_R${r}_NORM_${gradNorm.toFixed(6)}`);

      metadata.push(
        Object.freeze({
          layerId: `grad_shard_${r}`,
          gradNorm,
          ownerRank: r,
          isReduced: true,
          shardHash,
        })
      );

      if (r === this.localRank) {
        localReduced = shardGradients;
      }
    }

    return {
      localReducedGradients: Object.freeze(localReduced),
      metadata: Object.freeze(metadata),
    };
  }
}
