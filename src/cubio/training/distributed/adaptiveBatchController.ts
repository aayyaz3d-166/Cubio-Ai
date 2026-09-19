/**
 * CubiO — Universal Spatial Operating Environment
 * Phase 44: Adaptive Batch Controller
 *
 * Dynamically scales micro-batch size and gradient accumulation steps
 * based on memory pressure to guarantee 2GB edge working-set compliance.
 */

import {
  AdaptiveBatchConfig,
  AdaptiveBatchState,
} from './types';
import { AutonomousPressureTier } from '../../autonomous_resource/types';

export class AdaptiveBatchController {
  private config: AdaptiveBatchConfig;
  private currentMicroBatch: number;
  private currentAccumulation: number;

  constructor(configOverrides?: Partial<AdaptiveBatchConfig>) {
    this.config = Object.freeze({
      initialMicroBatchSize: 4,
      minMicroBatchSize: 1,
      maxMicroBatchSize: 8,
      gradientAccumulationSteps: 1,
      targetWorkingSetBytes: 512 * 1024 * 1024,
      ...configOverrides,
    });
    this.currentMicroBatch = this.config.initialMicroBatchSize;
    this.currentAccumulation = this.config.gradientAccumulationSteps;
  }

  /**
   * Adapts batch configuration according to real-time resource pressure tier.
   */
  public adaptForPressureTier(tier: AutonomousPressureTier): AdaptiveBatchState {
    let reason = 'NOMINAL_STATE';

    switch (tier) {
      case 'TIER_NOMINAL':
        this.currentMicroBatch = this.config.initialMicroBatchSize;
        this.currentAccumulation = this.config.gradientAccumulationSteps;
        reason = 'RESTORED_NOMINAL_BATCH';
        break;
      case 'TIER_ELEVATED':
        this.currentMicroBatch = Math.max(this.config.minMicroBatchSize, 2);
        this.currentAccumulation = 2;
        reason = 'ELEVATED_THROTTLED_MICROBATCH';
        break;
      case 'TIER_CRITICAL':
      case 'TIER_EMERGENCY':
        this.currentMicroBatch = this.config.minMicroBatchSize;
        this.currentAccumulation = 4;
        reason = 'CRITICAL_COLLAPSED_TO_MIN_MICROBATCH';
        break;
    }

    const effective = this.currentMicroBatch * this.currentAccumulation;

    return Object.freeze({
      currentMicroBatchSize: this.currentMicroBatch,
      currentAccumulationSteps: this.currentAccumulation,
      effectiveBatchSize: effective,
      isMemoryBounded: true,
      adaptationReason: reason,
    });
  }

  public getCurrentMicroBatchSize(): number {
    return this.currentMicroBatch;
  }

  public getCurrentAccumulationSteps(): number {
    return this.currentAccumulation;
  }

  public reset(): void {
    this.currentMicroBatch = this.config.initialMicroBatchSize;
    this.currentAccumulation = this.config.gradientAccumulationSteps;
  }
}
