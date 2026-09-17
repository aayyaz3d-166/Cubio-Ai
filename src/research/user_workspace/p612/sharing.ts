/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.12: Workspace Sharing Engine
 *
 * Coordinates creation, revocation, and resolution of shareable Space boundaries.
 */

import { PersonalSpace } from '../p68/types';
import { SpaceShare, WorkspaceMember, CollaborationEvent, PermissionSet } from './types';
import {
  deterministicHash,
  generateDeterministicShareId,
  generateDeterministicShareIdentity,
  generateDeterministicMemberId,
  generateDeterministicEventId,
} from './determinism';
import { PermissionEngine } from './permissions';

export class SharingEngine {
  public static createShare(
    space: PersonalSpace,
    ownerUserId: string,
    ownerUserName: string
  ): { share: SpaceShare; event: CollaborationEvent } {
    const shareId = generateDeterministicShareId(space.spaceId, ownerUserId);
    const shareIdentity = generateDeterministicShareIdentity(shareId);
    const ownerMemberId = generateDeterministicMemberId(shareId, ownerUserId);

    const ownerMember: WorkspaceMember = Object.freeze({
      memberId: ownerMemberId,
      userId: ownerUserId,
      userName: ownerUserName,
      accessLevel: 'OWNER',
      joinedAt: 0,
      permissions: PermissionEngine.getPermissionSet('OWNER'),
      lineageId: `LIN_MBR_${deterministicHash(`${shareId}_${ownerUserId}`)}`,
    });

    const members: readonly WorkspaceMember[] = Object.freeze([ownerMember]);
    const raw = JSON.stringify([
      shareId,
      space.spaceId,
      ownerUserId,
      'ACTIVE',
      members.map((m) => [m.memberId, m.userId, m.accessLevel]),
    ]);
    const shareChecksum = deterministicHash(raw);

    const share: SpaceShare = Object.freeze({
      shareId,
      spaceId: space.spaceId,
      ownerUserId,
      shareIdentity,
      status: 'ACTIVE',
      createdAt: 0,
      updatedAt: 0,
      members,
      shareChecksum,
      schemaVersion: '6.12.0',
    });

    const event: CollaborationEvent = Object.freeze({
      eventId: generateDeterministicEventId(shareId, 0, 'SHARE_CREATED'),
      shareId,
      spaceId: space.spaceId,
      actorUserId: ownerUserId,
      eventType: 'SHARE_CREATED',
      details: `Created SpaceShare for space ${space.name} (${space.spaceId})`,
      timestamp: 0,
      targetMemberId: ownerMemberId,
    });

    return { share, event };
  }

  public static revokeShare(
    share: SpaceShare,
    actor: WorkspaceMember
  ): { share: SpaceShare; event: CollaborationEvent } {
    PermissionEngine.assertCanPerformAction(actor, 'canRevokeAccess');

    const updatedMembers = Object.freeze(
      share.members.map((m) =>
        m.accessLevel === 'OWNER'
          ? m
          : Object.freeze({
              ...m,
              accessLevel: 'NO_ACCESS' as const,
              permissions: PermissionEngine.getPermissionSet('NO_ACCESS'),
            })
      )
    );

    const raw = JSON.stringify([
      share.shareId,
      share.spaceId,
      share.ownerUserId,
      'REVOKED',
      updatedMembers.map((m) => [m.memberId, m.userId, m.accessLevel]),
    ]);
    const shareChecksum = deterministicHash(raw);

    const updatedShare: SpaceShare = Object.freeze({
      ...share,
      status: 'REVOKED',
      members: updatedMembers,
      shareChecksum,
      updatedAt: 0,
    });

    const event: CollaborationEvent = Object.freeze({
      eventId: generateDeterministicEventId(share.shareId, share.members.length + 3, 'SHARE_REVOKED'),
      shareId: share.shareId,
      spaceId: share.spaceId,
      actorUserId: actor.userId,
      eventType: 'SHARE_REVOKED',
      details: `Revoked SpaceShare ${share.shareId}`,
      timestamp: 0,
    });

    return { share: updatedShare, event };
  }

  public static resolveShare(share: SpaceShare, userId: string): WorkspaceMember | null {
    if (share.status === 'REVOKED' && userId !== share.ownerUserId) {
      return null;
    }
    const member = share.members.find((m) => m.userId === userId);
    return member || null;
  }

  public static validateMemberAccess(
    share: SpaceShare,
    userId: string,
    requiredAction: keyof PermissionSet
  ): boolean {
    const member = this.resolveShare(share, userId);
    return PermissionEngine.canPerformAction(member, requiredAction);
  }
}
