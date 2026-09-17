/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.16: Recovery Determinism Utilities & Identity Generators
 *
 * Enforces zero random variation (σ² = 0) across all backup creation,
 * recovery point generation, manifest calculation, validation, preview,
 * restore, rollback, causality, and snapshot operations.
 */

export function deterministicHash(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function generateDeterministicRecoveryPointId(
  workspaceId: string,
  sourceChecksum: string,
  scope: string
): string {
  const hashKey = deterministicHash(`REC_PT_${workspaceId}_${sourceChecksum}_${scope}`);
  return `REC_PT_P616_${hashKey.slice(0, 8)}`;
}

export function generateDeterministicBackupId(
  workspaceId: string,
  scope: string,
  entityCount: number
): string {
  const hashKey = deterministicHash(`BAK_${workspaceId}_${scope}_${entityCount}`);
  return `BAK_P616_${hashKey.slice(0, 8)}`;
}

export function generateDeterministicManifestId(
  recoveryPointId: string,
  schemaVersion = '6.16.0'
): string {
  const hashKey = deterministicHash(`MAN_${recoveryPointId}_${schemaVersion}`);
  return `MAN_P616_${hashKey.slice(0, 8)}`;
}

export function generateDeterministicValidationId(
  recoveryPointId: string,
  status: string
): string {
  const hashKey = deterministicHash(`VAL_${recoveryPointId}_${status}`);
  return `VAL_P616_${hashKey.slice(0, 8)}`;
}

export function generateDeterministicRecoveryId(
  recoveryPointId: string,
  targetWorkspaceId: string
): string {
  const hashKey = deterministicHash(`REC_${recoveryPointId}_${targetWorkspaceId}`);
  return `REC_P616_${hashKey.slice(0, 8)}`;
}

export function generateDeterministicPreviewId(
  recoveryPointId: string,
  activeChecksum: string
): string {
  const hashKey = deterministicHash(`PREV_${recoveryPointId}_${activeChecksum}`);
  return `PREV_P616_${hashKey.slice(0, 8)}`;
}

export function generateDeterministicRollbackId(
  targetChecksum: string,
  recoveryPointId: string
): string {
  const hashKey = deterministicHash(`RLBK_${targetChecksum}_${recoveryPointId}`);
  return `RLBK_P616_${hashKey.slice(0, 8)}`;
}

export function generateDeterministicSnapshotId(
  recoveryPointId: string,
  activeChecksum: string
): string {
  const hashKey = deterministicHash(`SNAP_REC_${recoveryPointId}_${activeChecksum}`);
  return `SNAP_REC_P616_${hashKey.slice(0, 8)}`;
}

export function generateDeterministicEventId(
  eventType: string,
  recoveryPointId: string,
  sequence: number
): string {
  const hashKey = deterministicHash(`EV_${eventType}_${recoveryPointId}_${sequence}`);
  return `EV_P616_${hashKey.slice(0, 8)}`;
}

export function generateDeterministicConflictId(
  entityId: string,
  conflictType: string
): string {
  const hashKey = deterministicHash(`CNF_${entityId}_${conflictType}`);
  return `CNF_P616_${hashKey.slice(0, 8)}`;
}

export function generateDeterministicNewLineageId(
  originalLineageId: string,
  recoveryPointId: string
): string {
  const hashKey = deterministicHash(`LIN_NEW_${originalLineageId}_${recoveryPointId}`);
  return `LIN_REC_${hashKey.slice(0, 8)}`;
}

export function generateDeterministicNewEntityId(
  originalEntityId: string,
  recoveryPointId: string
): string {
  const hashKey = deterministicHash(`ENT_NEW_${originalEntityId}_${recoveryPointId}`);
  return `ENT_REC_${hashKey.slice(0, 8)}`;
}

export function generateDeterministicExportId(
  recoveryPointId: string,
  packageChecksum: string
): string {
  const hashKey = deterministicHash(`EXP_${recoveryPointId}_${packageChecksum}`);
  return `EXP_P616_${hashKey.slice(0, 8)}`;
}
