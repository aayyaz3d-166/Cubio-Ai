/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.23: Lifecycle Determinism Utilities
 *
 * Enforces pure cryptographic determinism (σ² = 0) across trash, archive,
 * recovery, and deletion operations.
 */

export function deterministicHash(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function generateDeterministicTrashId(
  entityType: string,
  entityId: string
): string {
  const hashKey = deterministicHash(`TRASH_${entityType}_${entityId}`);
  return `TRASH_P623_${hashKey.slice(0, 8)}`;
}

export function generateDeterministicArchiveId(
  entityType: string,
  entityId: string
): string {
  const hashKey = deterministicHash(`ARCH_${entityType}_${entityId}`);
  return `ARCH_P623_${hashKey.slice(0, 8)}`;
}

export function generateDeterministicRecoveryId(
  sourceId: string,
  entityId: string
): string {
  const hashKey = deterministicHash(`REC_${sourceId}_${entityId}`);
  return `REC_P623_${hashKey.slice(0, 8)}`;
}

export function generateDeterministicDeletionId(
  trashId: string,
  entityId: string
): string {
  const hashKey = deterministicHash(`DEL_${trashId}_${entityId}`);
  return `DEL_P623_${hashKey.slice(0, 8)}`;
}

export function generateDeterministicSnapshotId(
  workspaceId: string,
  stateHash: string
): string {
  const hashKey = deterministicHash(`SNAP_LIFE_${workspaceId}_${stateHash}`);
  return `SNAP_LIFE_P623_${hashKey.slice(0, 8)}`;
}

export function generateDeterministicHistoryId(
  eventType: string,
  entityId: string,
  sequence: number
): string {
  const hashKey = deterministicHash(`HIST_${eventType}_${entityId}_${sequence}`);
  return `HIST_P623_${hashKey.slice(0, 8)}`;
}

export function generateDeterministicLifecycleChecksum(data: unknown): string {
  return deterministicHash(JSON.stringify(data));
}
