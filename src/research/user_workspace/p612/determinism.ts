/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.12: Determinism Utilities & Share Identity Generators
 *
 * Enforces zero random variation (σ² = 0) across all collaboration and sharing operations.
 */

export function deterministicHash(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function generateDeterministicShareId(spaceId: string, ownerUserId: string): string {
  const hashKey = deterministicHash(`${spaceId}_${ownerUserId}_SHARE`);
  return `SHARE_P612_${hashKey.slice(0, 8)}`;
}

export function generateDeterministicShareIdentity(shareId: string): string {
  const hashKey = deterministicHash(`IDENTITY_${shareId}`);
  return `SHR_IDENT_${hashKey.slice(0, 8)}`;
}

export function generateDeterministicMemberId(shareId: string, userId: string): string {
  const hashKey = deterministicHash(`${shareId}_${userId}_MBR`);
  return `MBR_P612_${hashKey.slice(0, 8)}`;
}

export function generateDeterministicEventId(
  shareId: string,
  eventIndex: number,
  eventType: string
): string {
  const hashKey = deterministicHash(`${shareId}_EVT_${eventIndex}_${eventType}`);
  return `EVT_P612_${hashKey.slice(0, 8)}`;
}

export function generateDeterministicSnapshotId(shareId: string, label: string): string {
  const hashKey = deterministicHash(`${shareId}_SNAP_${label}`);
  return `SNAP_P612_${hashKey.slice(0, 8)}`;
}
