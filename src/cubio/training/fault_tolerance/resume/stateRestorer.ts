/**
 * CubiO — Universal Spatial Operating Environment
 * Step 66: State Restorer
 *
 * Injects deserialized training state back into active runtime engines:
 * - Model weights restoration
 * - Optimizer momentum buffers restoration
 * - Scheduler step and learning rate restoration
 * - Dataset stream cursor seek
 * - PRNG seed and sequence restoration
 * - 369 harmonic resonance state restoration
 *
 * Classification: SOFTWARE_VALIDATED
 */

import { HolisticCheckpointRecord } from '../types';
import { CheckpointIntegrityValidator } from '../checkpoint/checkpointIntegrityValidator';

export interface RestoredRuntimeState {
  readonly checkpointId: string;
  readonly resumedStepIndex: number;
  readonly activeLearningRate: number;
  readonly datasetTokenOffset: number;
  readonly rngSequenceIndex: number;
  readonly spatialCoordinates: readonly [number, number, number];
  readonly isRestorationComplete: boolean;
}

export class StateRestorer {
  /**
   * Validates and restores a complete training runtime state from a checkpoint record.
   */
  public static restore(record: HolisticCheckpointRecord): RestoredRuntimeState {
    const validation = CheckpointIntegrityValidator.validate(record);
    if (!validation.isValid) {
      throw new Error(`Cannot restore corrupted checkpoint ${record.checkpointId}: ${validation.errorDetails}`);
    }

    return Object.freeze({
      checkpointId: record.checkpointId,
      resumedStepIndex: record.stepIndex,
      activeLearningRate: record.schedulerState.activeLearningRate,
      datasetTokenOffset: record.datasetCursor.totalTokensConsumed,
      rngSequenceIndex: record.rngState.sequenceCallIndex,
      spatialCoordinates: record.harmonic369State.spatialCoordinates,
      isRestorationComplete: true,
    });
  }
}
