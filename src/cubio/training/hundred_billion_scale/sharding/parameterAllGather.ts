/**
 * CubiO — Step 86 Parameter All-Gather Runtime
 */

export class ParameterAllGather {
  public static allGather(rankSlices: readonly (readonly number[])[]): readonly number[] {
    const fullWeights: number[] = [];
    for (const slice of rankSlices) {
      fullWeights.push(...slice);
    }
    return Object.freeze(fullWeights);
  }
}
