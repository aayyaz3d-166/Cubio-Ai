/**
 * CubiO — Step 86 Checkpoint Failover Handler
 */

import { DistributedCheckpointMetadata } from '../types';

export class CheckpointFailover {
  public static selectBestRecoveryCheckpoint(
    checkpoints: readonly DistributedCheckpointMetadata[]
  ): DistributedCheckpointMetadata | undefined {
    if (checkpoints.length === 0) return undefined;
    return checkpoints[checkpoints.length - 1];
  }
}
