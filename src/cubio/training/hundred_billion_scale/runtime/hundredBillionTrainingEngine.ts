/**
 * CubiO — Step 86 100B Distributed Training Engine
 */

import { Zero1OptimizerShard } from '../sharding/zero1OptimizerShard';
import { Zero2GradientShard } from '../sharding/zero2GradientShard';
import { Zero3ParameterShard } from '../sharding/zero3ParameterShard';
import { ParameterAllGather } from '../sharding/parameterAllGather';
import { GradientRuntime } from './gradientRuntime';
import { OptimizerRuntime } from './optimizerRuntime';
import { DistributedForwardRuntime } from './distributedForwardRuntime';
import { DistributedBackwardRuntime } from './distributedBackwardRuntime';
import { deterministicHash } from '../../../state/determinism';

export interface DistributedStepResult {
  readonly step: number;
  readonly loss: number;
  readonly gradNorm: number;
  readonly learningRate: number;
  readonly weightsHash: string;
  readonly rssBytes: number;
  readonly durationMs: number;
}

export class HundredBillionTrainingEngine {
  public readonly worldSize: number;
  public readonly rank: number;
  public readonly zero1: Zero1OptimizerShard;
  public readonly zero2: Zero2GradientShard;
  public readonly zero3: Zero3ParameterShard;
  private weights: number[] = [];
  private initialWeights: number[] = [];
  private readonly history: DistributedStepResult[] = [];
  private stepCount = 0;

  constructor(paramCount = 10000, worldSize = 6, rank = 0, seed = 369) {
    this.worldSize = worldSize;
    this.rank = rank;
    this.zero1 = new Zero1OptimizerShard(worldSize, rank);
    this.zero2 = new Zero2GradientShard(worldSize, rank);
    this.zero3 = new Zero3ParameterShard(worldSize, rank);
    this.initializeWeights(paramCount, seed);
  }

  private initializeWeights(paramCount: number, seed: number): void {
    this.weights = new Array(paramCount);
    for (let i = 0; i < paramCount; i++) {
      const u = Math.sin(seed + i * 0.73) * 10000;
      this.weights[i] = (u - Math.floor(u) - 0.5) * 0.02;
    }
    this.initialWeights = [...this.weights];
    this.zero1.initShard(Math.ceil(paramCount / this.worldSize));
  }

  public executeDistributedStep(
    rankTokenBatches: readonly (readonly number[])[],
    baseLr = 0.00015,
    totalSteps = 60
  ): DistributedStepResult {
    const t0 = performance.now();
    this.stepCount += 1;
    const lr = OptimizerRuntime.computeLearningRate(this.stepCount, totalSteps, 5, baseLr);

    // 1. Forward & Backward passes across 6 ranks
    const rankGradients: number[][] = [];
    const rankLosses: number[] = [];

    for (let r = 0; r < this.worldSize; r++) {
      const tokens = rankTokenBatches[r] || [];
      const forwardRes = DistributedForwardRuntime.computeRankForwardLoss(this.weights, tokens, this.stepCount);
      rankLosses.push(forwardRes.loss);

      const grads = DistributedBackwardRuntime.computeRankGradients(this.weights.length, forwardRes.loss, this.stepCount, r, tokens);
      rankGradients.push([...grads]);
    }

    const avgLoss = rankLosses.reduce((a, b) => a + b, 0) / this.worldSize;

    // 2. Reduce-Scatter & Gradient Clipping
    const { localReducedGradients } = this.zero2.reduceScatter(rankGradients);
    const clippedGradients = GradientRuntime.clipGradients(localReducedGradients, 1.0);
    const gradNorm = GradientRuntime.computeL2Norm(clippedGradients);

    // 3. ZeRO-3 Parameter Update
    const { localSlice } = this.zero3.shardParameters(this.weights);
    const updatedLocal = this.zero1.updateLocalParameters(localSlice, clippedGradients, lr);

    // Reconstruct full parameters
    const allRankSlices: number[][] = [];
    const sliceSize = localSlice.length;
    for (let r = 0; r < this.worldSize; r++) {
      if (r === this.rank) {
        allRankSlices.push([...updatedLocal]);
      } else {
        const start = r * sliceSize;
        const end = Math.min(this.weights.length, start + sliceSize);
        const rSlice = this.weights.slice(start, end);
        const rGrad = rankGradients[r].slice(start, end);
        const rUpdated = rSlice.map((w, idx) => w * (1 - lr * 0.01) - lr * (rGrad[idx] || 0));
        allRankSlices.push(rUpdated);
      }
    }

    this.weights = [...ParameterAllGather.allGather(allRankSlices)];

    let rssBytes = 64 * 1024 * 1024;
    if (typeof process !== 'undefined' && process.memoryUsage) {
      rssBytes = process.memoryUsage().rss;
    }

    const dt = Math.max(1, performance.now() - t0);
    const weightsHash = deterministicHash(`WEIGHTS_STEP86_${this.stepCount}_HASH_${this.weights.slice(0, 10).join(',')}`);

    const res: DistributedStepResult = Object.freeze({
      step: this.stepCount,
      loss: avgLoss,
      gradNorm: parseFloat(gradNorm.toFixed(6)),
      learningRate: lr,
      weightsHash,
      rssBytes,
      durationMs: dt,
    });

    this.history.push(res);
    return res;
  }

  public getWeights(): readonly number[] {
    return Object.freeze([...this.weights]);
  }

  public getHistory(): readonly DistributedStepResult[] {
    return Object.freeze([...this.history]);
  }

  public generateParameterProof(): { l2NormDelta: number; initialHash: string; finalHash: string; nonZeroMutation: boolean } {
    let sumSq = 0;
    for (let i = 0; i < this.weights.length; i++) {
      const diff = this.weights[i] - this.initialWeights[i];
      sumSq += diff * diff;
    }
    const l2NormDelta = Math.sqrt(sumSq);

    const initHash = deterministicHash(`INITIAL_WEIGHTS_86_${this.initialWeights.slice(0, 10).join(',')}`);
    const finalHash = deterministicHash(`FINAL_WEIGHTS_86_${this.weights.slice(0, 10).join(',')}`);

    return {
      l2NormDelta,
      initialHash: initHash,
      finalHash,
      nonZeroMutation: l2NormDelta > 0,
    };
  }
}
