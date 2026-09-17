/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.23: Workspace Trash Manager
 *
 * Manages moving workspace entities to/from Trash while preserving
 * identity, lineage, space associations, and cryptographic checksums.
 */

import {
  TrashEntry,
  WorkspaceEntityReference,
  WorkspaceLifecycleState,
  LifecyclePermissionContext,
  TrashQuery,
} from './types';
import { LifecycleBoundaryEngine } from './lifecycleBoundary';
import {
  generateDeterministicTrashId,
  deterministicHash,
} from './determinism';

export class TrashManager {
  private trashMap = new Map<string, TrashEntry>();

  public moveToTrash(
    entity: WorkspaceEntityReference,
    context: LifecyclePermissionContext,
    previousState: WorkspaceLifecycleState = 'ACTIVE',
    reason?: string
  ): { success: boolean; entry?: TrashEntry; error?: string } {
    if (!LifecycleBoundaryEngine.canMutate(context, entity)) {
      return { success: false, error: 'UNAUTHORIZED_ACTION' };
    }

    LifecycleBoundaryEngine.sanitizeEntity(entity);

    const trashId = generateDeterministicTrashId(entity.entityType, entity.entityId);
    const trashedAt = 0; // Deterministic timestamp baseline

    const raw = JSON.stringify([
      trashId,
      entity.entityId,
      entity.entityType,
      entity.spaceId,
      entity.checksum,
      entity.lineageId,
      previousState,
      context.userId,
      reason ?? '',
    ]);
    const entryChecksum = deterministicHash(raw);

    const entry: TrashEntry = Object.freeze({
      trashId,
      entity: Object.freeze({ ...entity }),
      previousState,
      trashedAt,
      trashedBy: context.userId,
      reason,
      entryChecksum,
    });

    this.trashMap.set(entity.entityId, entry);
    return { success: true, entry };
  }

  public restoreFromTrash(
    entityId: string,
    context: LifecyclePermissionContext
  ): { success: boolean; restoredEntity?: WorkspaceEntityReference; sourceTrashId?: string; error?: string } {
    const entry = this.trashMap.get(entityId);
    if (!entry) {
      return { success: false, error: 'ENTRY_NOT_FOUND' };
    }

    if (!LifecycleBoundaryEngine.canMutate(context, entry.entity)) {
      return { success: false, error: 'UNAUTHORIZED_ACTION' };
    }

    this.trashMap.delete(entityId);
    return {
      success: true,
      restoredEntity: entry.entity,
      sourceTrashId: entry.trashId,
    };
  }

  public getTrash(
    context: LifecyclePermissionContext,
    query?: TrashQuery
  ): readonly TrashEntry[] {
    const all = Array.from(this.trashMap.values());
    const visible = LifecycleBoundaryEngine.filterVisibleTrash(all, context);

    if (!query) {
      return Object.freeze(visible);
    }

    return Object.freeze(
      visible.filter((entry) => {
        if (query.spaceId && entry.entity.spaceId !== query.spaceId) return false;
        if (query.entityType && entry.entity.entityType !== query.entityType) return false;
        if (query.ownerId && entry.entity.ownerId !== query.ownerId) return false;
        return true;
      })
    );
  }

  public getTrashEntry(
    entityId: string,
    context: LifecyclePermissionContext
  ): TrashEntry | null {
    const entry = this.trashMap.get(entityId);
    if (!entry) return null;
    const visible = LifecycleBoundaryEngine.filterVisibleTrash([entry], context);
    return visible.length > 0 ? visible[0] : null;
  }

  public emptyTrash(
    context: LifecyclePermissionContext
  ): { success: boolean; deletedCount: number; error?: string } {
    if (context.userRole !== 'OWNER' || context.isRevoked) {
      return { success: false, deletedCount: 0, error: 'UNAUTHORIZED_ACTION' };
    }

    const count = this.trashMap.size;
    this.trashMap.clear();
    return { success: true, deletedCount: count };
  }
}
