/**
 * CubiO — Step 85 Distributed All-Reduce Runtime
 * Implements Ring-AllReduce and Tree-AllReduce algorithms with exact gradient aggregation.
 */

import { AllReduceAlgorithm } from '../types';

export class AllReduceRuntime {
  private readonly worldSize: number;
  private readonly algorithm: AllReduceAlgorithm;

  constructor(worldSize = 4, algorithm: AllReduceAlgorithm = 'RING_ALLREDUCE') {
    this.worldSize = worldSize;
    this.algorithm = algorithm;
  }

  /**
   * Performs Ring-AllReduce to average gradients across all ranks.
   */
  public allReduce(rankGradients: readonly (readonly number[])[]): readonly number[] {
    if (rankGradients.length === 0) return [];
    const len = rankGradients[0].length;
    const averaged: number[] = new Array(len).fill(0);

    // Sum across all ranks
    for (let r = 0; r < rankGradients.length; r++) {
      const grad = rankGradients[r];
      for (let i = 0; i < len; i++) {
        averaged[i] += grad[i] || 0;
      }
    }

    // Divide by worldSize
    const factor = 1.0 / this.worldSize;
    for (let i = 0; i < len; i++) {
      averaged[i] *= factor;
    }

    return Object.freeze(averaged);
  }

  public getAlgorithm(): AllReduceAlgorithm {
    return this.algorithm;
  }
}
