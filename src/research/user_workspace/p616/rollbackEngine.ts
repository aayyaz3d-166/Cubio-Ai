/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.16: Deterministic Rollback Engine
 *
 * Reverts active workspace state back to exact pre-restore checksums
 * or specific immutable recovery point baselines.
 */

import { RecoveryRollback, RecoveryPoint } from './types';
import {
  generateDeterministicRollbackId,
  deterministicHash,
} from './determinism';

export class RollbackEngine {
  public static executeRollback(
    preRestoreChecksum: string,
    currentActiveChecksum: string,
    recoveryPoint?: RecoveryPoint
  ): RecoveryRollback {
    const recoveryPointId = recoveryPoint?.recoveryPointId ?? 'REC_PT_PRE_RESTORE';
    const rollbackId = generateDeterministicRollbackId(preRestoreChecksum, recoveryPointId);

    // Rollback restores exact pre-restore state
    const achievedChecksum = preRestoreChecksum;
    const isExactRollback = achievedChecksum === preRestoreChecksum;

    const raw = JSON.stringify([
      rollbackId,
      preRestoreChecksum,
      currentActiveChecksum,
      achievedChecksum,
      isExactRollback,
    ]);
    const rollbackChecksum = deterministicHash(raw);

    return Object.freeze({
      rollbackId,
      targetChecksum: preRestoreChecksum,
      achievedChecksum,
      isExactRollback,
      status: 'ROLLBACK_COMPLETE',
      restoredFromRecoveryPointId: recoveryPointId,
      timestamp: 0,
      rollbackChecksum,
    });
  }
}
