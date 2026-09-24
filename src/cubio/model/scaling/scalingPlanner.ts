/**
 * CubiO — Universal Spatial Operating Environment
 * Phase 45: Model Scaling Planner
 *
 * Generates execution and sharding plans for configurable model profiles across
 * heterogeneous cluster machines.
 */

import {
  ScalableModelArchitectureConfig,
  ModelScalingPlan,
  LayerShardAssignment,
} from './types';
import { ParameterEstimator } from './parameterEstimator';
import { MemoryEstimator } from './memoryEstimator';
import { deterministicHash } from '../../state/determinism';

export class ModelScalingPlanner {
  /**
   * Generates a concrete scaling plan for a model architecture.
   */
  public static createPlan(
    cfg: ScalableModelArchitectureConfig,
    availableNodes = ['PC_A_EDGE_2GB', 'PC_B_4GB', 'PC_C_8GB_GPU', 'PC_D_EDGE_2GB']
  ): ModelScalingPlan {
    const params = ParameterEstimator.estimate(cfg);
    const mem = MemoryEstimator.estimate(cfg);

    const layerShards: LayerShardAssignment[] = [];
    const bytesPerLayer = (params.attentionParamsPerLayer + params.ffnParamsPerLayer) *
      (cfg.defaultQuantization === 'INT4' ? 0.5 : 1.0);

    for (let l = 0; l < cfg.layerCount; l++) {
      const assignedNode = availableNodes[l % availableNodes.length];
      const shardHash = deterministicHash(`LSHARD:${cfg.modelId}:${l}:${assignedNode}:${bytesPerLayer}`);
      const casLayerCid = `bafk_layer_shard_${shardHash.slice(2, 10)}`;

      layerShards.push(
        Object.freeze({
          layerIndex: l,
          assignedNodeId: assignedNode,
          estimatedWeightBytes: bytesPerLayer,
          quantization: cfg.defaultQuantization,
          casLayerCid,
        })
      );
    }

    const executionMode = mem.residentWeightBytesINT8 <= 64 * 1024 * 1024
      ? 'FULLY_RESIDENT'
      : cfg.layerCount > 16
      ? 'FEDERATED_SHARDED'
      : 'TILED_STREAMING';

    const planHash = deterministicHash(
      `PLAN:${cfg.modelId}:${params.totalParameters}:${mem.executionWorkingSetBytes}:${executionMode}`
    );

    return Object.freeze({
      planId: `PLAN_${planHash.slice(2, 10)}`,
      config: cfg,
      parameters: params,
      memoryReport: mem,
      layerShards: Object.freeze(layerShards),
      totalShards: layerShards.length,
      executionMode,
      planChecksum: `0x${planHash}`,
    });
  }
}
