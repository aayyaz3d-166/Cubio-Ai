/**
 * CubiO — Step 85 Distributed Gradient Runtime
 * Manages gradient clipping, norm calculation, and loss scaling.
 */

export class GradientRuntime {
  public static computeL2Norm(gradients: readonly number[]): number {
    const sumSq = gradients.reduce((acc, g) => acc + g * g, 0);
    return Math.sqrt(sumSq);
  }

  public static clipGradients(gradients: readonly number[], maxNorm = 1.0): readonly number[] {
    const norm = this.computeL2Norm(gradients);
    if (norm <= maxNorm || norm === 0) {
      return gradients;
    }
    const scale = maxNorm / (norm + 1e-8);
    return Object.freeze(gradients.map((g) => g * scale));
  }
}
