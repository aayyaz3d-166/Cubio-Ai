/**
 * CubiO — Universal Spatial Operating Environment
 * Step 80: Optimizer Runtime
 *
 * Implements AdamW with first and second moment tracking on Float32Array weight tensors.
 *
 * Classification: SOFTWARE_VALIDATED
 */

export class OptimizerRuntime {
  private m: Float32Array;
  private v: Float32Array;
  private beta1: number;
  private beta2: number;
  private epsilon: number;
  private weightDecay: number;
  private updateCount = 0;

  constructor(
    paramCount: number,
    beta1 = 0.9,
    beta2 = 0.95,
    epsilon = 1e-8,
    weightDecay = 0.1
  ) {
    this.m = new Float32Array(paramCount);
    this.v = new Float32Array(paramCount);
    this.beta1 = beta1;
    this.beta2 = beta2;
    this.epsilon = epsilon;
    this.weightDecay = weightDecay;
  }

  /**
   * Applies an AdamW parameter step.
   */
  public step(weights: Float32Array, gradients: Float32Array, lr: number): void {
    this.updateCount++;
    const t = this.updateCount;
    const beta1Correction = 1 - Math.pow(this.beta1, t);
    const beta2Correction = 1 - Math.pow(this.beta2, t);

    for (let i = 0; i < weights.length; i++) {
      const g = gradients[i];

      this.m[i] = this.beta1 * this.m[i] + (1 - this.beta1) * g;
      this.v[i] = this.beta2 * this.v[i] + (1 - this.beta2) * g * g;

      const mHat = this.m[i] / beta1Correction;
      const vHat = this.v[i] / beta2Correction;

      // Decoupled weight decay
      weights[i] -= lr * this.weightDecay * weights[i];

      // Adam update
      const update = (lr * mHat) / (Math.sqrt(vHat) + this.epsilon);
      weights[i] -= update;
    }
  }

  public getUpdateCount(): number {
    return this.updateCount;
  }

  public getMoments(): { m: Float32Array; v: Float32Array } {
    return { m: this.m, v: this.v };
  }
}
