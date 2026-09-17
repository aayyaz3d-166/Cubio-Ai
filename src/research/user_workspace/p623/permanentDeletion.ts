/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.23: Permanent Deletion Engine
 *
 * Executes permanent deletion for TRASHED entities with OWNER authorization,
 * producing immutable cryptographic audit records.
 */

import {
  DeletionRecord,
  TrashEntry,
  LifecyclePermissionContext,
} from './types';
import { LifecycleBoundaryEngine } from './lifecycleBoundary';
import {
  generateDeterministicDeletionId,
  deterministicHash,
} from './determinism';

export class PermanentDeletionEngine {
  public static permanentlyDelete(
    trashEntry: TrashEntry,
    context: LifecyclePermissionContext
  ): { success: boolean; record?: DeletionRecord; error?: string } {
    // 1. Authorization Check (Owner only)
    if (!LifecycleBoundaryEngine.canPermanentlyDelete(context, trashEntry.entity)) {
      return { success: false, error: 'PERMANENT_DELETE_BLOCKED: Requires OWNER authorization' };
    }

    const entity = trashEntry.entity;
    const deletionId = generateDeterministicDeletionId(trashEntry.trashId, entity.entityId);
    const deletedAt = 0;

    const raw = JSON.stringify([
      deletionId,
      entity.entityId,
      entity.entityType,
      entity.spaceId,
      trashEntry.trashId,
      context.userId,
    ]);
    const auditChecksum = deterministicHash(raw);

    const record: DeletionRecord = Object.freeze({
      deletionId,
      entityId: entity.entityId,
      entityType: entity.entityType,
      spaceId: entity.spaceId,
      deletedFromTrashId: trashEntry.trashId,
      deletedAt,
      deletedBy: context.userId,
      auditChecksum,
    });

    return {
      success: true,
      record,
    };
  }
}
