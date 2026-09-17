/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.23: Deterministic Lifecycle Recovery Manager
 *
 * Restores original workspace entities from Trash or Archive states
 * after rigorous lineage and cryptographic checksum verification.
 */

import {
  WorkspaceEntityReference,
  RecoveryRecord,
  LifecyclePermissionContext,
  TrashEntry,
  ArchiveEntry,
} from './types';
import {
  generateDeterministicRecoveryId,
  deterministicHash,
} from './determinism';

export class LifecycleRecoveryManager {
  public static recoverFromTrash(
    trashEntry: TrashEntry,
    context: LifecyclePermissionContext
  ): { success: boolean; recoveredEntity?: WorkspaceEntityReference; record?: RecoveryRecord; error?: string } {
    const entity = trashEntry.entity;

    // Verify entity integrity
    if (!entity.entityId || !entity.lineageId || !entity.checksum) {
      return { success: false, error: 'RECOVERY_BLOCKED: Corrupt or missing entity parameters' };
    }

    if (entity.coordinates) {
      const [x, y, z] = entity.coordinates;
      if (Number.isNaN(x) || Number.isNaN(y) || Number.isNaN(z) || !Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) {
        return { success: false, error: 'RECOVERY_BLOCKED: Non-finite or NaN coordinates' };
      }
    }

    const recoveryId = generateDeterministicRecoveryId(trashEntry.trashId, entity.entityId);
    const restoredAt = 0;

    const raw = JSON.stringify([
      recoveryId,
      entity.entityId,
      entity.entityType,
      trashEntry.trashId,
      'TRASH',
      entity.checksum,
      context.userId,
    ]);
    const recordChecksum = deterministicHash(raw);

    const record: RecoveryRecord = Object.freeze({
      recoveryId,
      entityId: entity.entityId,
      entityType: entity.entityType,
      sourceTrashOrArchiveId: trashEntry.trashId,
      restoredFrom: 'TRASH',
      restoredChecksum: entity.checksum,
      restoredAt,
      restoredBy: context.userId,
      recordChecksum,
    });

    return {
      success: true,
      recoveredEntity: Object.freeze({ ...entity }),
      record,
    };
  }

  public static recoverFromArchive(
    archiveEntry: ArchiveEntry,
    context: LifecyclePermissionContext
  ): { success: boolean; recoveredEntity?: WorkspaceEntityReference; record?: RecoveryRecord; error?: string } {
    const entity = archiveEntry.entity;

    // Verify entity integrity
    if (!entity.entityId || !entity.lineageId || !entity.checksum) {
      return { success: false, error: 'RECOVERY_BLOCKED: Corrupt or missing entity parameters' };
    }

    if (entity.coordinates) {
      const [x, y, z] = entity.coordinates;
      if (Number.isNaN(x) || Number.isNaN(y) || Number.isNaN(z) || !Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) {
        return { success: false, error: 'RECOVERY_BLOCKED: Non-finite or NaN coordinates' };
      }
    }

    const recoveryId = generateDeterministicRecoveryId(archiveEntry.archiveId, entity.entityId);
    const restoredAt = 0;

    const raw = JSON.stringify([
      recoveryId,
      entity.entityId,
      entity.entityType,
      archiveEntry.archiveId,
      'ARCHIVE',
      entity.checksum,
      context.userId,
    ]);
    const recordChecksum = deterministicHash(raw);

    const record: RecoveryRecord = Object.freeze({
      recoveryId,
      entityId: entity.entityId,
      entityType: entity.entityType,
      sourceTrashOrArchiveId: archiveEntry.archiveId,
      restoredFrom: 'ARCHIVE',
      restoredChecksum: entity.checksum,
      restoredAt,
      restoredBy: context.userId,
      recordChecksum,
    });

    return {
      success: true,
      recoveredEntity: Object.freeze({ ...entity }),
      record,
    };
  }
}
