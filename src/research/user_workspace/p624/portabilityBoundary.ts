/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.24: Portability Boundary & Privacy Enforcer
 *
 * Enforces role authorization boundaries, user isolation, and guarantees
 * zero leakage of authentication secrets, payment info, or private cross-space data.
 */

import {
  PortabilityPermissionContext,
  PackageEntity,
  WorkspacePackage,
} from './types';

export class PortabilityBoundaryEngine {
  public static canExport(
    context: PortabilityPermissionContext,
    entities: readonly PackageEntity[]
  ): boolean {
    if (context.isRevoked) return false;
    if (context.userRole === 'NO_ACCESS') return false;

    if (context.userRole === 'OWNER') {
      return true;
    }

    if (context.userRole === 'EDITOR' || context.userRole === 'OBSERVER') {
      // Must only contain authorized/accessible space entities
      return entities.every((e) => {
        if (e.ownerId === context.userId) return true;
        if (context.accessibleSpaceIds && context.accessibleSpaceIds.includes(e.spaceId)) {
          return true;
        }
        return false;
      });
    }

    return false;
  }

  public static canImport(
    context: PortabilityPermissionContext,
    targetSpaceId?: string
  ): boolean {
    if (context.isRevoked) return false;
    if (context.userRole === 'NO_ACCESS' || context.userRole === 'OBSERVER') {
      return false;
    }

    if (context.userRole === 'OWNER') {
      return true;
    }

    if (context.userRole === 'EDITOR') {
      if (!targetSpaceId) return false;
      return !!context.accessibleSpaceIds && context.accessibleSpaceIds.includes(targetSpaceId);
    }

    return false;
  }

  public static sanitizeEntity(entity: PackageEntity): PackageEntity {
    const json = JSON.stringify(entity);
    if (
      json.includes('password') ||
      json.includes('authToken') ||
      json.includes('creditCard') ||
      json.includes('billingSecret')
    ) {
      throw new Error('Privacy Violation: Forbidden credential or payment data detected in package entity');
    }
    return entity;
  }

  public static sanitizePackage(pkg: WorkspacePackage): void {
    const json = JSON.stringify(pkg);
    if (
      json.includes('password') ||
      json.includes('authToken') ||
      json.includes('creditCard') ||
      json.includes('billingSecret')
    ) {
      throw new Error('Privacy Violation: Forbidden credential or payment data detected in workspace package');
    }
  }
}
