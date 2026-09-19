/**
 * CubiO — Step 86 Gradient Reduce-Scatter Runtime
 */

export class GradientReduceScatter {
  public static reduceScatter(
    rankGradients: readonly (readonly number[])[],
    worldSize: number,
    localRank: number
  ): readonly number[] {
    const totalParams = rankGradients[0]?.length || 0;
    const sliceSize = Math.ceil(totalParams / worldSize);
    const start = localRank * sliceSize;
    const end = Math.min(totalParams, start + sliceSize);

    const localReduced: number[] = [];
    for (let i = start; i < end; i++) {
      let sum = 0;
      for (let r = 0; r < worldSize; r++) {
        sum += rankGradients[r][i] || 0;
      }
      localReduced.push(sum / worldSize);
    }

    return Object.freeze(localReduced);
  }
}
