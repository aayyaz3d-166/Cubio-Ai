/**
 * CubiO — Universal Spatial Operating Environment
 * Step 84: Incremental Checkpoint Manager
 *
 * Coordinates incremental delta serialization for 1B scales.
 *
 * Classification: SOFTWARE_VALIDATED
 */

import { MilestoneCheckpointEntry } from '../types';

export class IncrementalCheckpointManager {
  public static calculateStateDelta(prev: MilestoneCheckpointEntry, curr: MilestoneCheckpointEntry): {
    tokensDelta: number;
    lossDelta: number;
  } {
    return {
      tokensDelta: curr.cumulativeTokens - prev.cumulativeTokens,
      lossDelta: parseFloat((curr.trainingLoss - prev.trainingLoss).toFixed(4)),
    };
  }
}
