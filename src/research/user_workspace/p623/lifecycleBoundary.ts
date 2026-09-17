/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.23: Lifecycle Boundary & Privacy Enforcer
 *
 * Enforces role-based permissions, cross-user privacy isolation, and credential protection.
 */

import {
  LifecyclePermissionContext,
  WorkspaceEntityReference,
  TrashEntry,
  ArchiveEntry,
} from './types';

export class LifecycleBoundaryEngine {
  public static canMutate(
    context: LifecyclePermissionContext,
    entity: WorkspaceEntityReference
  ): boolean {
    if (context.isRevoked) return false;
    if (context.userRole === 'NO_ACCESS') return false;
    if (context.userRole === 'OBSERVER') return false;

    if (context.userRole === 'OWNER') {
      return true;
    }

    if (context.userRole === 'EDITOR') {
      if (entity.ownerId === context.userId) return true;
      if (context.accessibleSpaceIds && context.accessibleSpaceIds.includes(entity.spaceId)) {
        return true;
      }
    }

    return false;
  }

  public static canPermanentlyDelete(
    context: LifecyclePermissionContext,
    entity: WorkspaceEntityReference
  ): boolean {
    if (context.isRevoked) return false;
    if (context.userRole !== 'OWNER') return false;
    return true;
  }

  public static filterVisibleTrash(
    entries: readonly TrashEntry[],
    context: LifecyclePermissionContext
  ): readonly TrashEntry[] {
    if (context.isRevoked || context.userRole === 'NO_ACCESS') {
      return Object.freeze([]);
    }

    return Object.freeze(
      entries.filter((entry) => {
        if (context.userRole === 'OWNER') return true;
        if (entry.entity.ownerId === context.userId) return true;
        if (context.accessibleSpaceIds && context.accessibleSpaceIds.includes(entry.entity.spaceId)) {
          return true;
        }
        return false;
      })
    );
  }

  public static filterVisibleArchive(
    entries: readonly ArchiveEntry[],
    context: LifecyclePermissionContext
  ): readonly ArchiveEntry[] {
    if (context.isRevoked || context.userRole === 'NO_ACCESS') {
      return Object.freeze([]);
    }

    return Object.freeze(
      entries.filter((entry) => {
        if (context.userRole === 'OWNER') return true;
        if (entry.entity.ownerId === context.userId) return true;
        if (context.accessibleSpaceIds && context.accessibleSpaceIds.includes(entry.entity.spaceId)) {
          return true;
        }
        return false;
      })
    );
  }

  public static sanitizeEntity(entity: WorkspaceEntityReference): WorkspaceEntityReference {
    const json = JSON.stringify(entity);
    if (json.includes('password') || json.includes('authToken') || json.includes('creditCard') || json.includes('billingSecret')) {
      throw new Error('Privacy Violation: Credentials or billing info detected in workspace entity payload');
    }
    return entity;
  }
}
