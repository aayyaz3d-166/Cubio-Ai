/**
 * CUBiO AI — Task 166: Native Training Compute & Efficiency
 * src/cubio/model/native_training_efficiency/deterministicBatcher.ts
 *
 * Deterministic batching and gradient accumulation sequencing engine.
 * Guarantees 100% reproducible micro-batch splits and orderings across runs,
 * and manages gradient accumulation buffers for memory-constrained execution.
 */

import { TrainingBatchConfig, TrainingEpisode } from './types';

/**
 * Sovereign PRNG for reproducible shuffling.
 */
class DeterministicShuffler {
  private state: number;

  constructor(seed: number = 36988888) {
    this.state = seed >>> 0;
  }

  public nextFloat(): number {
    this.state = (Math.imul(1664525, this.state) + 1013904223) >>> 0;
    return (this.state >>> 0) / 4294967296;
  }

  public shuffle<T>(array: readonly T[]): T[] {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(this.nextFloat() * (i + 1));
      const temp = copy[i];
      copy[i] = copy[j];
      copy[j] = temp;
    }
    return copy;
  }
}

export class DeterministicBatcher {
  private readonly config: TrainingBatchConfig;
  private readonly shuffler: DeterministicShuffler;

  constructor(config: TrainingBatchConfig) {
    this.config = config;
    this.shuffler = new DeterministicShuffler(config.seed ?? 36988888);
  }

  /**
   * Generates deterministic micro-batches from an array of episodes.
   */
  public createMicroBatches(episodes: readonly TrainingEpisode[]): TrainingEpisode[][] {
    const ordered = this.shuffler.shuffle(episodes);
    const batches: TrainingEpisode[][] = [];
    const batchSize = Math.max(1, this.config.batchSize);

    for (let i = 0; i < ordered.length; i += batchSize) {
      batches.push(ordered.slice(i, i + batchSize));
    }

    return batches;
  }

  /**
   * Determines whether the current micro-step represents an optimizer update boundary.
   */
  public isAccumulationBoundary(microStep: number, isLastMicroStep: boolean): boolean {
    const K = Math.max(1, this.config.gradientAccumulationSteps);
    return microStep % K === 0 || isLastMicroStep;
  }

  /**
   * Initializes a zero-filled accumulator matrix matching a weight shape.
   */
  public static createAccumulator(rows: number, cols: number): number[][] {
    const mat: number[][] = new Array(rows);
    for (let r = 0; r < rows; r++) {
      mat[r] = new Array(cols).fill(0);
    }
    return mat;
  }

  /**
   * Accumulates instantaneous gradients into the accumulation buffer.
   * Scaled by 1/K so the accumulated gradient represents the average over K micro-steps.
   */
  public static accumulate(
    accumulator: number[][],
    instantaneousGrad: readonly (readonly number[])[],
    scale: number
  ): void {
    for (let r = 0; r < accumulator.length; r++) {
      const accRow = accumulator[r];
      const gradRow = instantaneousGrad[r];
      for (let c = 0; c < accRow.length; c++) {
        accRow[c] += gradRow[c] * scale;
      }
    }
  }

  /**
   * Resets an accumulator buffer to zero.
   */
  public static resetAccumulator(accumulator: number[][]): void {
    for (let r = 0; r < accumulator.length; r++) {
      accumulator[r].fill(0);
    }
  }
}
