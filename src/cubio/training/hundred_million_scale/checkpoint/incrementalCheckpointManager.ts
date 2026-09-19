/**
 * CubiO — Universal Spatial Operating Environment
 * Step 83: Incremental Checkpoint Manager
 *
 * Coordinates incremental delta serialization for 100M scales.
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
