/**
 * CubiO — Step 89 Tensor Parallel Sharder
 */

export class TensorParallelShard {
  public static shardWeights(weights: readonly number[], worldSize: number, rank: number): readonly number[] {
    const shardSize = Math.ceil(weights.length / worldSize);
    const start = rank * shardSize;
    const end = Math.min(weights.length, start + shardSize);
    return Object.freeze(weights.slice(start, end));
  }
}
