/**
 * CubiO — Step 86 Distributed Backward Runtime
 */

export class DistributedBackwardRuntime {
  public static computeRankGradients(
    paramCount: number,
    loss: number,
    step: number,
    rank: number,
    tokens: readonly number[]
  ): readonly number[] {
    const grads: number[] = new Array(paramCount);
    const err = (loss * 0.08) / (1 + step * 0.04);

    for (let i = 0; i < paramCount; i++) {
      grads[i] = err * Math.sin((tokens[i % tokens.length] || 1) + i + rank * 7);
    }

    return Object.freeze(grads);
  }
}
