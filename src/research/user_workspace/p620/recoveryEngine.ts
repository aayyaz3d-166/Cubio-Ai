/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.20: Deterministic Workspace Recovery Engine
 *
 * Executes verified restorations of recovery checkpoints, saved states,
 * and version checkpoints without mutating historical records.
 */

import {
  RecoveryCheckpoint,
  RecoveryResult,
  RecoveryState,
  AuditableSavedState,
  AuditableVersion,
} from './types';
import { RecoveryStateValidator } from './recoveryValidator';
import {
  generateDeterministicRecoveryId,
  deterministicHash,
} from './determinism';

export class WorkspaceRecoveryEngine {
  /**
   * Restore state directly from an immutable checkpoint.
   */
  public static restoreCheckpoint(
    checkpoint: RecoveryCheckpoint,
    targetSpaceId?: string
  ): RecoveryResult {
    const stateToRestore = checkpoint.capturedState;
    const validation = RecoveryStateValidator.validate(stateToRestore);

    if (!validation.isValid) {
      return Object.freeze({
        success: false,
        status: 'RECOVERY_BLOCKED',
        sourceCheckpointId: checkpoint.checkpointId,
        validationIssues: validation.issues,
        error: `Recovery blocked: ${validation.issues.join('; ')}`,
      });
    }

    const spaceId = targetSpaceId ?? checkpoint.spaceId;
    const recoveryId = generateDeterministicRecoveryId(checkpoint.checkpointId, spaceId);

    const rawRestore = JSON.stringify([
      recoveryId,
      checkpoint.checkpointId,
      spaceId,
      checkpoint.realityChecksum,
      checkpoint.modelChecksum,
      checkpoint.geometryChecksum,
      checkpoint.canonicalCoordinates,
      checkpoint.certainty,
    ]);
    const restoredChecksum = deterministicHash(rawRestore);

    return Object.freeze({
      success: true,
      recoveryId,
      status: 'RESTORED',
      sourceCheckpointId: checkpoint.checkpointId,
      restoredChecksum,
      restoredState: Object.freeze({ ...stateToRestore }),
      validationIssues: [],
    });
  }

  /**
   * Restore state from a Saved State entity.
   */
  public static restoreSavedState(
    savedState: AuditableSavedState,
    baseState: RecoveryState
  ): RecoveryResult {
    const targetState: RecoveryState = {
      ...baseState,
      savedState,
      stateChecksum: savedState.aggregateChecksum,
    };

    const validation = RecoveryStateValidator.validate(targetState);
    if (!validation.isValid) {
      return Object.freeze({
        success: false,
        status: 'RECOVERY_BLOCKED',
        validationIssues: validation.issues,
        error: `Saved state recovery blocked: ${validation.issues.join('; ')}`,
      });
    }

    const recoveryId = `REC_ST_${savedState.stateId}`;
    return Object.freeze({
      success: true,
      recoveryId,
      status: 'RESTORED',
      restoredChecksum: savedState.aggregateChecksum,
      restoredState: Object.freeze(targetState),
      validationIssues: [],
    });
  }

  /**
   * Restore state from a Version entity.
   */
  public static restoreVersion(
    version: AuditableVersion,
    baseState: RecoveryState
  ): RecoveryResult {
    const targetState: RecoveryState = {
      ...baseState,
      version,
      stateChecksum: version.stateChecksum,
    };

    const validation = RecoveryStateValidator.validate(targetState);
    if (!validation.isValid) {
      return Object.freeze({
        success: false,
        status: 'RECOVERY_BLOCKED',
        validationIssues: validation.issues,
        error: `Version recovery blocked: ${validation.issues.join('; ')}`,
      });
    }

    const recoveryId = `REC_VER_${version.versionId}`;
    return Object.freeze({
      success: true,
      recoveryId,
      status: 'RESTORED',
      restoredChecksum: version.stateChecksum,
      restoredState: Object.freeze(targetState),
      validationIssues: [],
    });
  }
}
