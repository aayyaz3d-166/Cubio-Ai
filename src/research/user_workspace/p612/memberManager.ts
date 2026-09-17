/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.12: Workspace Member Manager
 *
 * Coordinates membership operations, permission updates, and prevents privilege escalation.
 */

import {
  SpaceShare,
  WorkspaceMember,
  AccessLevel,
  CollaborationEvent,
} from './types';
import {
  deterministicHash,
  generateDeterministicMemberId,
  generateDeterministicEventId,
} from './determinism';
import { PermissionEngine } from './permissions';

export class MemberManager {
  public static addMember(
    share: SpaceShare,
    userId: string,
    userName: string,
    accessLevel: AccessLevel,
    actor: WorkspaceMember
  ): { share: SpaceShare; member: WorkspaceMember; event: CollaborationEvent } {
    PermissionEngine.assertCanPerformAction(actor, 'canManageMembers');

    if (share.status === 'REVOKED') {
      throw new Error('Cannot add members to a revoked SpaceShare.');
    }

    if (accessLevel === 'OWNER') {
      throw new Error('Cannot add a secondary OWNER. Exactly one owner per Space is permitted.');
    }

    // Check for duplicate membership
    const existing = share.members.find((m) => m.userId === userId);
    if (existing) {
      throw new Error(`User ${userId} is already a member with role ${existing.accessLevel}.`);
    }

    const memberId = generateDeterministicMemberId(share.shareId, userId);
    const permissions = PermissionEngine.getPermissionSet(accessLevel);
    const lineageId = `LIN_MBR_${deterministicHash(`${share.shareId}_${userId}`)}`;

    const newMember: WorkspaceMember = Object.freeze({
      memberId,
      userId,
      userName,
      accessLevel,
      joinedAt: 0,
      permissions,
      lineageId,
    });

    const updatedMembers = Object.freeze([...share.members, newMember]);
    const updatedShare = this.recalculateShare(share, updatedMembers);

    const event: CollaborationEvent = Object.freeze({
      eventId: generateDeterministicEventId(share.shareId, share.members.length, 'MEMBER_INVITED'),
      shareId: share.shareId,
      spaceId: share.spaceId,
      actorUserId: actor.userId,
      eventType: 'MEMBER_INVITED',
      details: `Invited user ${userName} (${userId}) as ${accessLevel}`,
      timestamp: 0,
      targetMemberId: memberId,
    });

    return { share: updatedShare, member: newMember, event };
  }

  public static removeMember(
    share: SpaceShare,
    memberId: string,
    actor: WorkspaceMember
  ): { share: SpaceShare; event: CollaborationEvent } {
    PermissionEngine.assertCanPerformAction(actor, 'canManageMembers');

    const target = share.members.find((m) => m.memberId === memberId);
    if (!target) {
      throw new Error(`Member ${memberId} not found in share.`);
    }

    if (target.accessLevel === 'OWNER') {
      throw new Error('Authoritative OWNER cannot be removed from SpaceShare.');
    }

    const updatedMembers = Object.freeze(share.members.filter((m) => m.memberId !== memberId));
    const updatedShare = this.recalculateShare(share, updatedMembers);

    const event: CollaborationEvent = Object.freeze({
      eventId: generateDeterministicEventId(share.shareId, share.members.length + 1, 'MEMBER_REMOVED'),
      shareId: share.shareId,
      spaceId: share.spaceId,
      actorUserId: actor.userId,
      eventType: 'MEMBER_REMOVED',
      details: `Removed member ${target.userName} (${memberId})`,
      timestamp: 0,
      targetMemberId: memberId,
    });

    return { share: updatedShare, event };
  }

  public static updateAccess(
    share: SpaceShare,
    memberId: string,
    newAccess: AccessLevel,
    actor: WorkspaceMember
  ): { share: SpaceShare; event: CollaborationEvent } {
    PermissionEngine.assertCanPerformAction(actor, 'canChangePermissions');

    const target = share.members.find((m) => m.memberId === memberId);
    if (!target) {
      throw new Error(`Member ${memberId} not found in share.`);
    }

    if (target.accessLevel === 'OWNER') {
      throw new Error('Authoritative OWNER role cannot be changed.');
    }

    if (newAccess === 'OWNER') {
      throw new Error('Cannot elevate member to OWNER. Only one owner is allowed.');
    }

    const updatedTarget: WorkspaceMember = Object.freeze({
      ...target,
      accessLevel: newAccess,
      permissions: PermissionEngine.getPermissionSet(newAccess),
    });

    const updatedMembers = Object.freeze(
      share.members.map((m) => (m.memberId === memberId ? updatedTarget : m))
    );
    const updatedShare = this.recalculateShare(share, updatedMembers);

    const event: CollaborationEvent = Object.freeze({
      eventId: generateDeterministicEventId(
        share.shareId,
        share.members.length + 2,
        'PERMISSION_CHANGED'
      ),
      shareId: share.shareId,
      spaceId: share.spaceId,
      actorUserId: actor.userId,
      eventType: 'PERMISSION_CHANGED',
      details: `Changed role of ${target.userName} from ${target.accessLevel} to ${newAccess}`,
      timestamp: 0,
      targetMemberId: memberId,
    });

    return { share: updatedShare, event };
  }

  private static recalculateShare(
    share: SpaceShare,
    members: readonly WorkspaceMember[]
  ): SpaceShare {
    const raw = JSON.stringify([
      share.shareId,
      share.spaceId,
      share.ownerUserId,
      share.status,
      members.map((m) => [m.memberId, m.userId, m.accessLevel]),
    ]);
    const shareChecksum = deterministicHash(raw);

    return Object.freeze({
      ...share,
      members,
      shareChecksum,
      updatedAt: 0,
    });
  }
}
