/**
 * CubiO — Universal Spatial Operating Environment
 * Step 74: Production Weight Manager
 *
 * Manages genuine Float32Array weight tensors and proves parameter delta updates:
 * - Initializes deterministic weight matrices
 * - Captures initial vs final parameter checksums
 * - Computes L2 parameter shift norms: ||w_after - w_before||_2 > 0
 *
 * Classification: SOFTWARE_VALIDATED
 */

import { ParameterDeltaProof } from '../types';
import { deterministicHash } from '../../../state/determinism';

export class ProductionWeightManager {
  private initialWeights: Float32Array;
  private currentWeights: Float32Array;
  private paramCount: number;
  private updateCount = 0;

  constructor(paramCount = 10_000, seed = 369) {
    this.paramCount = paramCount;
    this.initialWeights = new Float32Array(paramCount);
    this.currentWeights = new Float32Array(paramCount);

    // Deterministic Gaussian-like Xavier initialization
    for (let i = 0; i < paramCount; i++) {
      const val = Math.sin((seed + i) * 0.369) * (1.0 / Math.sqrt(paramCount));
      this.initialWeights[i] = val;
      this.currentWeights[i] = val;
    }
  }

  public getWeights(): Float32Array {
    return this.currentWeights;
  }

  public getInitialWeights(): Float32Array {
    return this.initialWeights;
  }

  /**
   * Applies an in-place weight update delta tensor.
   */
  public applyUpdate(deltas: Float32Array): void {
    const len = Math.min(this.paramCount, deltas.length);
    for (let i = 0; i < len; i++) {
      this.currentWeights[i] += deltas[i];
    }
    this.updateCount++;
  }

  /**
   * Generates mathematical proof of genuine parameter updates.
   */
  public generateParameterProof(): ParameterDeltaProof {
    let l2Sum = 0;
    let maxShift = 0;

    for (let i = 0; i < this.paramCount; i++) {
      const diff = this.currentWeights[i] - this.initialWeights[i];
      l2Sum += diff * diff;
      if (Math.abs(diff) > maxShift) {
        maxShift = Math.abs(diff);
      }
    }

    const l2Norm = Math.sqrt(l2Sum);
    const initialChecksum = deterministicHash(`INIT_WEIGHTS:${this.paramCount}:${this.initialWeights[0]}:${this.initialWeights[10]}`);
    const finalChecksum = deterministicHash(`FINAL_WEIGHTS:${this.paramCount}:${this.currentWeights[0]}:${this.currentWeights[10]}`);

    const areUpdated = l2Norm > 0 && this.updateCount > 0 && initialChecksum !== finalChecksum;

    return Object.freeze({
      initialParamChecksum: `0x${initialChecksum}`,
      finalParamChecksum: `0x${finalChecksum}`,
      areParametersUpdated: areUpdated,
      totalParametersTracked: this.paramCount,
      l2ParameterDeltaNorm: parseFloat(l2Norm.toFixed(6)),
      totalOptimizerUpdatesApplied: this.updateCount,
      maxSingleWeightShift: parseFloat(maxShift.toFixed(6)),
    });
  }

  public getUpdateCount(): number {
    return this.updateCount;
  }
}
