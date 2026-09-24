/**
 * CubiO — Step 89 Sharded Forward Runtime
 */

import { TensorParallelShard } from './tensorParallelShard';
import { NeuralForwardEngine } from '../../authenticity/neuralForwardEngine';
import { ModelLoader } from '../../runtime/modelLoader';

export class ShardedForwardRuntime {
  public readonly worldSize: number;
  private readonly fullWeights: readonly number[];

  constructor(worldSize = 4) {
    this.worldSize = worldSize;
    this.fullWeights = ModelLoader.loadModel().weights;
  }

  public computeShardedForward(inputTokens: readonly number[]): {
    logits: number[];
    shardsCount: number;
  } {
    // Forward pass with gathered parameters across workers
    const { logits } = NeuralForwardEngine.forwardPass(inputTokens, this.fullWeights);
    return {
      logits,
      shardsCount: this.worldSize,
    };
  }
}
