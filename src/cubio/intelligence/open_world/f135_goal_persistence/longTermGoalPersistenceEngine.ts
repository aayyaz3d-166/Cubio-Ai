/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F135: Long-Term Goal Persistence Engine
 *
 * Maintains long-horizon goals and causal progress across sessions and disconnects.
 */

import { deterministicHash } from '../../../state/determinism';
import { LongTermGoalSnapshot } from '../types';

export class CubiOLongTermGoalPersistenceEngine {
  public persistGoalSnapshot(
    persistentGoalId: string,
    rootIntention: string,
    completedMilestones: readonly string[],
    pendingMilestones: readonly string[],
    disconnects: number = 1
  ): LongTermGoalSnapshot {
    const stateMerkleRoot = deterministicHash(
      `${persistentGoalId}:${rootIntention}:${completedMilestones.length}:${pendingMilestones.length}`
    );

    return Object.freeze({
      persistentGoalId,
      rootIntention,
      completedMilestones: Object.freeze([...completedMilestones]),
      pendingMilestones: Object.freeze([...pendingMilestones]),
      survivedColdDisconnectsCount: disconnects,
      stateMerkleRoot,
    });
  }
}
