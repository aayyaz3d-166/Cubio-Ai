/**
 * CubiO — Step 86 Recovery Coordinator
 */

import { NodeFailureRecoveryResult, DistributedCheckpointMetadata } from '../types';
import { CrashRecoveryManager } from '../checkpoint/crashRecoveryManager';
import { NodeRegistry } from '../cluster/nodeRegistry';
import { DistributedShardScheduler } from '../data/distributedShardScheduler';

export class RecoveryCoordinator {
  public static executeFullRecovery(
    failedRanks: readonly number[],
    registry: NodeRegistry,
    scheduler: DistributedShardScheduler,
    lastCheckpoint: DistributedCheckpointMetadata,
    currentStep: number
  ): NodeFailureRecoveryResult {
    const activeRanks = registry
      .getAllNodes()
      .filter((n) => !failedRanks.includes(n.nodeRank))
      .map((n) => n.nodeRank);

    for (const r of failedRanks) {
      scheduler.reassignShardsFromFailedRank(r, activeRanks);
    }

    const failureType = failedRanks.length > 1 ? 'MULTI_NODE' : 'SINGLE_NODE';
    return CrashRecoveryManager.recoverFromFailure(failedRanks, failureType, lastCheckpoint, currentStep);
  }
}
