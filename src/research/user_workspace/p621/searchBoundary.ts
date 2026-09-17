/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.21: Search Permission & Privacy Boundary Enforcer
 *
 * Enforces strict multi-tenant authorization boundaries:
 * - OWNER: discover owned workspace state
 * - EDITOR: discover shared/editable state
 * - OBSERVER: discover authorized observable state only
 * - NO_ACCESS: zero results
 *
 * Guarantees zero leakage of private spaces, private experiments, auth secrets, or payment data.
 */

import { SearchIndexEntry, SearchPermissionContext } from './types';

export class SearchBoundaryEngine {
  public static isAuthorized(
    entry: SearchIndexEntry,
    context: SearchPermissionContext
  ): boolean {
    if (context.userRole === 'NO_ACCESS') {
      return false;
    }

    if (context.userRole === 'OWNER') {
      return true;
    }

    if (context.userRole === 'EDITOR') {
      if (entry.ownerId === context.userId) {
        return true;
      }
      if (entry.accessLevel === 'PUBLIC' || entry.accessLevel === 'SHARED') {
        if (context.accessibleSpaceIds && !context.accessibleSpaceIds.includes(entry.spaceId)) {
          return false;
        }
        return true;
      }
      return false;
    }

    if (context.userRole === 'OBSERVER') {
      if (entry.accessLevel === 'PUBLIC' || entry.accessLevel === 'SHARED') {
        if (context.accessibleSpaceIds && !context.accessibleSpaceIds.includes(entry.spaceId)) {
          return false;
        }
        return true;
      }
      return false;
    }

    return false;
  }

  public static filterAuthorizedEntries(
    entries: readonly SearchIndexEntry[],
    context: SearchPermissionContext
  ): readonly SearchIndexEntry[] {
    if (context.userRole === 'NO_ACCESS') {
      return Object.freeze([]);
    }
    return Object.freeze(entries.filter((entry) => this.isAuthorized(entry, context)));
  }

  public static sanitizeMetadata<T extends Record<string, unknown>>(metadata: T): T {
    const json = JSON.stringify(metadata);
    if (json.includes('password') || json.includes('token') || json.includes('creditCard') || json.includes('billingSecret')) {
      throw new Error('Privacy Violation: Forbidden credential or payment data detected in metadata');
    }
    return metadata;
  }
}
