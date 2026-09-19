/**
 * CubiO — Step 85 ZeRO-1 Optimizer State Sharding
 * Partitions AdamW first and second moments across ranks, achieving (1/N) memory overhead.
 */

import { OptimizerShardMetadata } from '../types';
import { deterministicHash } from '../../../state/determinism';

export class OptimizerSharding {
  private readonly worldSize: number;
  private readonly localRank: number;
  private momentumShard: number[] = [];
  private varianceShard: number[] = [];
  private step = 0;

  constructor(worldSize: number, localRank: number) {
    this.worldSize = worldSize;
    this.localRank = localRank;
  }

  /**
   * Initializes local slice of AdamW states for local parameter slice.
   */
  public initShard(localParamCount: number): void {
    this.momentumShard = new Array(localParamCount).fill(0);
    this.varianceShard = new Array(localParamCount).fill(0);
  }

  /**
   * Updates local parameter slice using partitioned AdamW momentum and variance.
   */
  public updateLocalParameters(
    localParams: readonly number[],
    localGradients: readonly number[],
    lr = 0.00015,
    beta1 = 0.9,
    beta2 = 0.999,
    eps = 1e-8,
    weightDecay = 0.01
  ): readonly number[] {
    this.step += 1;
    const updated: number[] = [];

    for (let i = 0; i < localParams.length; i++) {
      const g = localGradients[i] || 0;
      this.momentumShard[i] = beta1 * (this.momentumShard[i] || 0) + (1 - beta1) * g;
      this.varianceShard[i] = beta2 * (this.varianceShard[i] || 0) + (1 - beta2) * g * g;

      const mHat = this.momentumShard[i] / (1 - Math.pow(beta1, this.step));
      const vHat = this.varianceShard[i] / (1 - Math.pow(beta2, this.step));

      const param = localParams[i];
      const decayed = param * (1 - lr * weightDecay);
      const update = decayed - (lr * mHat) / (Math.sqrt(vHat) + eps);
      updated.push(update);
    }

    return Object.freeze(updated);
  }

  public getMetadata(): OptimizerShardMetadata {
    const momHash = deterministicHash(`MOM_R${this.localRank}_SUM_${this.momentumShard.reduce((a, b) => a + b, 0)}`);
    const varHash = deterministicHash(`VAR_R${this.localRank}_SUM_${this.varianceShard.reduce((a, b) => a + b, 0)}`);

    return Object.freeze({
      ownerRank: this.localRank,
      momentumStateHash: momHash,
      varianceStateHash: varHash,
      stepCount: this.step,
      memorySavingsRatio: (this.worldSize - 1) / this.worldSize,
    });
  }
}
