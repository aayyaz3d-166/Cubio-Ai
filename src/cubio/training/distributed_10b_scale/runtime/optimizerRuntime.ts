/**
 * CubiO — Step 85 Distributed Optimizer Runtime
 * Implements AdamW optimizer with cosine learning rate decay and linear warmup.
 */

export class OptimizerRuntime {
  public static computeLearningRate(
    currentStep: number,
    totalSteps: number,
    warmupSteps = 5,
    baseLr = 0.00015,
    minLr = 1e-6
  ): number {
    if (currentStep < warmupSteps) {
      return baseLr * (currentStep / Math.max(1, warmupSteps));
    }
    const progress = (currentStep - warmupSteps) / Math.max(1, totalSteps - warmupSteps);
    const cosineDecay = 0.5 * (1 + Math.cos(Math.PI * progress));
    return minLr + (baseLr - minLr) * cosineDecay;
  }
}
