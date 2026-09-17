/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.12: Collaboration Validator Engine
 *
 * Validates ownership, permission structures, member uniqueness, and boundary integrity.
 */

import { SpaceShare, CollaborationValidationReport } from './types';
import { deterministicHash } from './determinism';

export class CollaborationValidator {
  public static validateShare(share: SpaceShare): CollaborationValidationReport {
    const issues: string[] = [];

    const schemaVer = String(share.schemaVersion || '');
    if (schemaVer !== '6.12.0' && !schemaVer.startsWith('6.')) {
      issues.push(`Invalid schema version: ${share.schemaVersion}`);
    }

    if (!share.ownerUserId || !share.ownerUserId.trim()) {
      issues.push('Missing or empty ownerUserId.');
    }

    const seenMemberIds = new Set<string>();
    const seenUserIds = new Set<string>();

    for (const member of share.members) {
      if (seenMemberIds.has(member.memberId)) {
        issues.push(`Duplicate memberId found: ${member.memberId}`);
      }
      seenMemberIds.add(member.memberId);

      if (seenUserIds.has(member.userId)) {
        issues.push(`Duplicate userId found: ${member.userId}`);
      }
      seenUserIds.add(member.userId);

      if (!['OWNER', 'EDITOR', 'OBSERVER', 'NO_ACCESS'].includes(member.accessLevel)) {
        issues.push(`Invalid access level: ${member.accessLevel}`);
      }
    }

    const owners = share.members.filter((m) => m.accessLevel === 'OWNER');
    if (owners.length !== 1) {
      issues.push(`Expected exactly 1 OWNER, found ${owners.length}.`);
    } else if (owners[0].userId !== share.ownerUserId) {
      issues.push(`Owner member userId (${owners[0].userId}) does not match share.ownerUserId (${share.ownerUserId}).`);
    }

    const isValid = issues.length === 0;
    const status = !isValid
      ? issues.some((i) => i.includes('schema version'))
        ? 'INVALID_SCHEMA_VERSION'
        : issues.some((i) => i.includes('Duplicate'))
        ? 'DUPLICATE_MEMBER_ID'
        : issues.some((i) => i.includes('access level'))
        ? 'INVALID_PERMISSIONS'
        : issues.some((i) => i.includes('OWNER') || i.includes('ownerUserId'))
        ? 'INVALID_OWNER'
        : 'CORRUPTED_COLLABORATION_STATE'
      : 'COLLABORATION_VALID';

    const reportChecksum = deterministicHash(
      JSON.stringify([status, isValid, share.shareChecksum, issues.length])
    );

    return Object.freeze({
      isValid,
      status,
      issues: Object.freeze(issues),
      reportChecksum,
    });
  }

  public static validateFiniteCoordinates(coordinates: readonly number[]): boolean {
    return coordinates.every((c) => typeof c === 'number' && Number.isFinite(c) && !Number.isNaN(c));
  }
}
