/**
 * CubiO — Universal Spatial Operating Environment
 * Step 74: Real AdamW Optimizer
 *
 * Genuine AdamW implementation with momentum buffers:
 * - m_t = beta1 * m_{t-1} + (1 - beta1) * g_t
 * - v_t = beta2 * v_{t-1} + (1 - beta2) * g_t^2
 * - Bias corrections: m_hat = m_t / (1 - beta1^t), v_hat = v_t / (1 - beta2^t)
 * - Decoupled weight decay: delta_w = -lr * (m_hat / (sqrt(v_hat) + eps) + lambda * w)
 *
 * Classification: SOFTWARE_VALIDATED
 */

import { ProductionTrainingConfig } from '../types';

export class RealAdamWOptimizer {
  private config: ProductionTrainingConfig;
  private m: Float32Array;
  private v: Float32Array;
  private stepCount = 0;

  constructor(paramCount: number, config: ProductionTrainingConfig) {
    this.config = config;
    this.m = new Float32Array(paramCount);
    this.v = new Float32Array(paramCount);
  }

  /**
   * Computes AdamW weight delta tensor given current weights and gradients.
   */
  public computeStep(
    weights: Float32Array,
    gradients: Float32Array,
    activeLR: number
  ): Float32Array {
    this.stepCount++;
    const t = this.stepCount;
    const len = Math.min(weights.length, gradients.length);
    const deltas = new Float32Array(len);

    const beta1 = this.config.beta1;
    const beta2 = this.config.beta2;
    const eps = this.config.epsilon;
    const lambda = this.config.weightDecay;

    const biasCorrection1 = 1.0 - Math.pow(beta1, t);
    const biasCorrection2 = 1.0 - Math.pow(beta2, t);

    for (let i = 0; i < len; i++) {
      const g = gradients[i];

      // Update biased first moment estimate
      this.m[i] = beta1 * this.m[i] + (1.0 - beta1) * g;
      // Update biased second raw moment estimate
      this.v[i] = beta2 * this.v[i] + (1.0 - beta2) * (g * g);

      // Compute bias-corrected estimates
      const mHat = this.m[i] / Math.max(1e-8, biasCorrection1);
      const vHat = this.v[i] / Math.max(1e-8, biasCorrection2);

      // Compute update with decoupled weight decay
      const stepUpdate = (mHat / (Math.sqrt(vHat) + eps)) + (lambda * weights[i]);
      deltas[i] = -activeLR * stepUpdate;
    }

    return deltas;
  }

  public getStepCount(): number {
    return this.stepCount;
  }
}
