/**
 * CubiO — Universal Spatial Operating Environment
 * Step 79: Gradient Accumulator
 *
 * Manages micro-batch gradient accumulation and global gradient norm clipping.
 *
 * Classification: SOFTWARE_VALIDATED
 */

export class GradientAccumulator {
  private accumulatedGradients: Float32Array;
  private accumulationCount = 0;

  constructor(paramCount: number) {
    this.accumulatedGradients = new Float32Array(paramCount);
  }

  /**
   * Accumulates a gradient micro-step.
   */
  public accumulate(gradients: Float32Array): void {
    for (let i = 0; i < this.accumulatedGradients.length; i++) {
      this.accumulatedGradients[i] += gradients[i];
    }
    this.accumulationCount++;
  }

  /**
   * Normalizes accumulated gradients and applies max norm clipping.
   */
  public getNormalizedGradients(maxNorm = 1.0): {
    normalizedGradients: Float32Array;
    gradientNorm: number;
  } {
    const count = Math.max(1, this.accumulationCount);
    const n = this.accumulatedGradients.length;
    const res = new Float32Array(n);

    let sumSq = 0;
    for (let i = 0; i < n; i++) {
      res[i] = this.accumulatedGradients[i] / count;
      sumSq += res[i] * res[i];
    }

    const norm = Math.sqrt(sumSq);
    if (norm > maxNorm) {
      const scale = maxNorm / norm;
      for (let i = 0; i < n; i++) {
        res[i] *= scale;
      }
    }

    return Object.freeze({
      normalizedGradients: res,
      gradientNorm: parseFloat(norm.toFixed(6)),
    });
  }

  /**
   * Resets accumulator for next macro-step.
   */
  public reset(): void {
    this.accumulatedGradients.fill(0);
    this.accumulationCount = 0;
  }
}
