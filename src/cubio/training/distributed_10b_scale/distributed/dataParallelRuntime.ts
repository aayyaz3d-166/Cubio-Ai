/**
 * CubiO — Step 85 Data-Parallel Distributed Runtime
 * Coordinates multi-rank forward, backward, gradient sync, and parameter updates.
 */

import { ZeROConfig } from '../types';
import { ParameterSharding } from './parameterSharding';
import { GradientSharding } from './gradientSharding';
import { OptimizerSharding } from './optimizerSharding';
import { AllReduceRuntime } from './allReduceRuntime';
import { CommunicationProfiler } from './communicationProfiler';

export class DataParallelRuntime {
  public readonly worldSize: number;
  public readonly rank: number;
  public readonly config: ZeROConfig;
  public readonly paramSharding: ParameterSharding;
  public readonly gradSharding: GradientSharding;
  public readonly optSharding: OptimizerSharding;
  public readonly allReduce: AllReduceRuntime;
  public readonly profiler: CommunicationProfiler;

  constructor(worldSize = 4, rank = 0, config?: Partial<ZeROConfig>) {
    this.worldSize = worldSize;
    this.rank = rank;
    this.config = Object.freeze({
      stage: config?.stage || 'STAGE_2_GRADIENT',
      offloadOptimizerToCpu: config?.offloadOptimizerToCpu ?? false,
      offloadParamsToCpu: config?.offloadParamsToCpu ?? false,
      overlapComm: config?.overlapComm ?? true,
      contiguousGradients: config?.contiguousGradients ?? true,
      reduceBucketSize: config?.reduceBucketSize || 50000000,
      allReduceAlgorithm: config?.allReduceAlgorithm || 'RING_ALLREDUCE',
    });

    this.paramSharding = new ParameterSharding(worldSize, rank);
    this.gradSharding = new GradientSharding(worldSize, rank);
    this.optSharding = new OptimizerSharding(worldSize, rank);
    this.allReduce = new AllReduceRuntime(worldSize, this.config.allReduceAlgorithm);
    this.profiler = new CommunicationProfiler();
  }

  public synchronizeGradients(allRankGradients: readonly (readonly number[])[], step: number): readonly number[] {
    const t0 = performance.now();
    const averaged = this.allReduce.allReduce(allRankGradients);
    const dt = Math.max(0.1, performance.now() - t0);
    const bytes = averaged.length * 4 * this.worldSize;

    this.profiler.recordTransfer(step, 'ALL_REDUCE', dt, bytes, 0.88);
    return averaged;
  }
}
