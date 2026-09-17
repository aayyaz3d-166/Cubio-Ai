/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.14: Access Control & Privacy Filter
 *
 * Enforces strict access boundaries:
 * - OWNER: access all entities in their workspace.
 * - EDITOR: access permitted workspace/space entities.
 * - OBSERVER: access only PUBLIC or SHARED entities.
 * - NO_ACCESS: 0 results returned.
 *
 * Unauthorized entities behave as if they do not exist.
 * Private credentials, payment data, and unrelated user spaces are strictly excluded.
 */

import { IndexedEntity, SearchAccessContext } from './types';

export class AccessFilter {
  /**
   * Filter entities strictly according to user access context.
   */
  public static filterEntities(
    entities: readonly IndexedEntity[],
    context: SearchAccessContext
  ): readonly IndexedEntity[] {
    if (!context || context.userRole === 'NO_ACCESS') {
      return Object.freeze([]);
    }

    const filtered = entities.filter((entity) => {
      // Must match workspace boundary
      if (entity.workspaceId !== context.workspaceId) {
        return false;
      }

      // Check user role
      if (context.userRole === 'OWNER') {
        // Owner has access to all non-restricted entities or entities they own
        if (entity.ownerId === context.userId || entity.accessLevel !== 'RESTRICTED') {
          return true;
        }
        return false;
      }

      if (context.userRole === 'EDITOR') {
        // Own entities are accessible
        if (entity.ownerId === context.userId) {
          return true;
        }
        // Public or shared entities
        if (entity.accessLevel === 'PUBLIC' || entity.accessLevel === 'SHARED') {
          // If explicit space/experiment restriction is present
          if (entity.spaceId && context.accessibleSpaceIds) {
            return context.accessibleSpaceIds.includes(entity.spaceId);
          }
          return true;
        }
        return false;
      }

      if (context.userRole === 'OBSERVER') {
        // Observers only see PUBLIC or explicitly SHARED entities
        if (entity.accessLevel === 'PUBLIC' || entity.accessLevel === 'SHARED') {
          if (entity.spaceId && context.accessibleSpaceIds) {
            return context.accessibleSpaceIds.includes(entity.spaceId);
          }
          return true;
        }
        return false;
      }

      return false;
    });

    return Object.freeze(filtered);
  }

  /**
   * Check if a single entity is accessible.
   */
  public static isAccessible(
    entity: IndexedEntity,
    context: SearchAccessContext
  ): boolean {
    const list = AccessFilter.filterEntities([entity], context);
    return list.length > 0;
  }
}
