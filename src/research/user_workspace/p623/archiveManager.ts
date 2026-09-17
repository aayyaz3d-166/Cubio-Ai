/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.23: Workspace Archive Manager
 *
 * Manages archiving and restoring workspace entities while preserving
 * identity, lineage, space associations, and cryptographic checksums.
 */

import {
  ArchiveEntry,
  WorkspaceEntityReference,
  WorkspaceLifecycleState,
  LifecyclePermissionContext,
  ArchiveQuery,
} from './types';
import { LifecycleBoundaryEngine } from './lifecycleBoundary';
import {
  generateDeterministicArchiveId,
  deterministicHash,
} from './determinism';

export class ArchiveManager {
  private archiveMap = new Map<string, ArchiveEntry>();

  public archiveEntity(
    entity: WorkspaceEntityReference,
    context: LifecyclePermissionContext,
    previousState: WorkspaceLifecycleState = 'ACTIVE',
    reason?: string
  ): { success: boolean; entry?: ArchiveEntry; error?: string } {
    if (!LifecycleBoundaryEngine.canMutate(context, entity)) {
      return { success: false, error: 'UNAUTHORIZED_ACTION' };
    }

    LifecycleBoundaryEngine.sanitizeEntity(entity);

    const archiveId = generateDeterministicArchiveId(entity.entityType, entity.entityId);
    const archivedAt = 0; // Deterministic timestamp baseline

    const raw = JSON.stringify([
      archiveId,
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

    const entry: ArchiveEntry = Object.freeze({
      archiveId,
      entity: Object.freeze({ ...entity }),
      previousState,
      archivedAt,
      archivedBy: context.userId,
      reason,
      entryChecksum,
    });

    this.archiveMap.set(entity.entityId, entry);
    return { success: true, entry };
  }

  public restoreArchive(
    entityId: string,
    context: LifecyclePermissionContext
  ): { success: boolean; restoredEntity?: WorkspaceEntityReference; sourceArchiveId?: string; error?: string } {
    const entry = this.archiveMap.get(entityId);
    if (!entry) {
      return { success: false, error: 'ENTRY_NOT_FOUND' };
    }

    if (!LifecycleBoundaryEngine.canMutate(context, entry.entity)) {
      return { success: false, error: 'UNAUTHORIZED_ACTION' };
    }

    this.archiveMap.delete(entityId);
    return {
      success: true,
      restoredEntity: entry.entity,
      sourceArchiveId: entry.archiveId,
    };
  }

  public getArchivedEntities(
    context: LifecyclePermissionContext,
    query?: ArchiveQuery
  ): readonly ArchiveEntry[] {
    const all = Array.from(this.archiveMap.values());
    const visible = LifecycleBoundaryEngine.filterVisibleArchive(all, context);

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

  public getArchiveEntry(
    entityId: string,
    context: LifecyclePermissionContext
  ): ArchiveEntry | null {
    const entry = this.archiveMap.get(entityId);
    if (!entry) return null;
    const visible = LifecycleBoundaryEngine.filterVisibleArchive([entry], context);
    return visible.length > 0 ? visible[0] : null;
  }
}
