/**
 * CubiO — Universal Spatial Operating Environment
 * Step 83: Crash Recovery Manager
 *
 * Restores training sessions from milestone checkpoints.
 *
 * Classification: SOFTWARE_VALIDATED
 */

import { MilestoneCheckpointEntry } from '../types';

export class CrashRecoveryManager {
  public static restoreFromMilestone(node: MilestoneCheckpointEntry): {
    resumedStep: number;
    resumedTokens: number;
    resumedOffset: number;
    isRecovered: boolean;
  } {
    return Object.freeze({
      resumedStep: node.step,
      resumedTokens: node.cumulativeTokens,
      resumedOffset: node.datasetOffset,
      isRecovered: node.checkpointHash.startsWith('0x'),
    });
  }
}
