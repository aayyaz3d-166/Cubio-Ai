/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.12: Access Levels & Permission Matrix
 *
 * Enforces explicit role-based access control with deny-by-default behavior.
 */

import { AccessLevel, PermissionSet, WorkspaceMember } from './types';

export const PERMISSION_MATRIX: Record<AccessLevel, PermissionSet> = Object.freeze({
  OWNER: Object.freeze({
    canReadState: true,
    canMutateState: true,
    canCreateSnapshot: true,
    canManageMembers: true,
    canChangePermissions: true,
    canRevokeAccess: true,
    canResetState: true,
  }),
  EDITOR: Object.freeze({
    canReadState: true,
    canMutateState: true,
    canCreateSnapshot: true,
    canManageMembers: false,
    canChangePermissions: false,
    canRevokeAccess: false,
    canResetState: false,
  }),
  OBSERVER: Object.freeze({
    canReadState: true,
    canMutateState: false,
    canCreateSnapshot: false,
    canManageMembers: false,
    canChangePermissions: false,
    canRevokeAccess: false,
    canResetState: false,
  }),
  NO_ACCESS: Object.freeze({
    canReadState: false,
    canMutateState: false,
    canCreateSnapshot: false,
    canManageMembers: false,
    canChangePermissions: false,
    canRevokeAccess: false,
    canResetState: false,
  }),
});

export class PermissionEngine {
  public static getPermissionSet(accessLevel: AccessLevel): PermissionSet {
    const perms = PERMISSION_MATRIX[accessLevel];
    if (!perms) {
      return PERMISSION_MATRIX.NO_ACCESS;
    }
    return perms;
  }

  public static canPerformAction(
    member: WorkspaceMember | null | undefined,
    action: keyof PermissionSet
  ): boolean {
    if (!member) return false;
    if (member.accessLevel === 'NO_ACCESS') return false;
    return Boolean(member.permissions[action]);
  }

  public static assertCanPerformAction(
    member: WorkspaceMember | null | undefined,
    action: keyof PermissionSet
  ): void {
    if (!this.canPerformAction(member, action)) {
      throw new Error(
        `Access denied: member ${member?.memberId || 'UNKNOWN'} (role: ${
          member?.accessLevel || 'NO_ACCESS'
        }) lacks permission '${action}'.`
      );
    }
  }

  public static isOwner(member: WorkspaceMember | null | undefined): boolean {
    return member?.accessLevel === 'OWNER';
  }
}
