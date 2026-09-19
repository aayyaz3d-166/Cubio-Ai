/**
 * CubiO — Universal Spatial Operating Environment
 * Step 65: Dynamic Batch Allocator
 *
 * Dynamically solves global batch size, micro-batch per device,
 * and gradient accumulation steps:
 * G = ceil(B_global_tokens / (B_micro * SequenceLength * DP_ranks))
 *
 * Classification: SOFTWARE_VALIDATED
 */

import { BatchAllocationConfig, ModelScaleTier } from '../types';

export class DynamicBatchAllocator {
  /**
   * Solves batch allocation configuration for a given model scale and data-parallel world size.
   */
  public static solveBatchAllocation(
    scale: ModelScaleTier,
    sequenceLength = 2048,
    dpWorldSize = 1,
    isEdgeProfile = true
  ): BatchAllocationConfig {
    let targetGlobalTokens = 524_288; // 0.5M tokens standard
    let microBatchSeq = 4;

    switch (scale) {
      case '8M':
      case '32M':
        targetGlobalTokens = 262_144; // 0.25M tokens
        microBatchSeq = isEdgeProfile ? 2 : 8;
        break;

      case '128M':
        targetGlobalTokens = 524_288; // 0.5M tokens
        microBatchSeq = isEdgeProfile ? 2 : 4;
        break;

      case '512M':
        targetGlobalTokens = 1_048_576; // 1.0M tokens
        microBatchSeq = isEdgeProfile ? 1 : 4;
        break;

      case '1B':
      case '7B':
        targetGlobalTokens = 2_097_152; // 2.0M tokens
        microBatchSeq = isEdgeProfile ? 1 : 2;
        break;
    }

    const tokensPerStepPerDP = microBatchSeq * sequenceLength;
    const totalTokensPerMicroStep = tokensPerStepPerDP * Math.max(1, dpWorldSize);
    const gradAccumSteps = Math.max(1, Math.ceil(targetGlobalTokens / totalTokensPerMicroStep));
    const effectiveGlobalTokens = totalTokensPerMicroStep * gradAccumSteps;

    // Estimated activation memory per sequence
    const estActivationMB = Math.round((microBatchSeq * sequenceLength * 768 * 2) / (1024 * 1024));

    return Object.freeze({
      globalBatchSizeTokens: effectiveGlobalTokens,
      microBatchSizePerDevice: microBatchSeq,
      sequenceLengthTokens: sequenceLength,
      dataParallelWorldSize: dpWorldSize,
      gradientAccumulationSteps: gradAccumSteps,
      isActivationCheckpointingEnabled: true,
      estimatedActivationMemoryMB: estActivationMB,
    });
  }
}
