/**
 * CubiO — Universal Spatial Operating Environment
 * Step 65: Learning Rate Governor
 *
 * Monitors loss and gradient norm spikes, temporarily dampening learning rates
 * to prevent numerical divergence during pretraining.
 *
 * Classification: SOFTWARE_VALIDATED
 */

export class LearningRateGovernor {
  private spikeThreshold: number;
  private dampeningFactor: number;
  private recoverySteps: number;
  private currentDampeningMultiplier = 1.0;
  private stepsRemainingInDampening = 0;

  constructor(spikeThreshold = 3.0, dampeningFactor = 0.50, recoverySteps = 100) {
    this.spikeThreshold = spikeThreshold;
    this.dampeningFactor = dampeningFactor;
    this.recoverySteps = recoverySteps;
  }

  /**
   * Evaluates gradient norm and adjusts active LR multiplier.
   */
  public evaluateStep(gradientNorm: number): { multiplier: number; isDamped: boolean } {
    if (gradientNorm > this.spikeThreshold) {
      this.currentDampeningMultiplier = this.dampeningFactor;
      this.stepsRemainingInDampening = this.recoverySteps;
      return { multiplier: this.currentDampeningMultiplier, isDamped: true };
    }

    if (this.stepsRemainingInDampening > 0) {
      this.stepsRemainingInDampening--;
      // Gradual linear recovery to 1.0
      const recoveryProgress = 1.0 - this.stepsRemainingInDampening / this.recoverySteps;
      this.currentDampeningMultiplier = this.dampeningFactor + recoveryProgress * (1.0 - this.dampeningFactor);
      return { multiplier: parseFloat(this.currentDampeningMultiplier.toFixed(4)), isDamped: true };
    }

    this.currentDampeningMultiplier = 1.0;
    return { multiplier: 1.0, isDamped: false };
  }

  public reset(): void {
    this.currentDampeningMultiplier = 1.0;
    this.stepsRemainingInDampening = 0;
  }
}
