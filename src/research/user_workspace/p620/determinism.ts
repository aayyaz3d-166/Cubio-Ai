/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.20: Audit & Recovery Determinism Utilities
 *
 * Enforces pure cryptographic determinism (σ² = 0) without timestamps or Math.random().
 */

export function deterministicHash(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function generateDeterministicAuditId(
  workspaceId: string,
  entityCount: number
): string {
  const hashKey = deterministicHash(`AUD_${workspaceId}_${entityCount}`);
  return `AUD_P620_${hashKey.slice(0, 8)}`;
}

export function generateDeterministicIntegrityId(
  workspaceId: string,
  status: string
): string {
  const hashKey = deterministicHash(`INT_${workspaceId}_${status}`);
  return `INT_P620_${hashKey.slice(0, 8)}`;
}

export function generateDeterministicCheckpointId(
  spaceId: string,
  realityChecksum: string,
  versionRef: string
): string {
  const hashKey = deterministicHash(`CHK_${spaceId}_${realityChecksum}_${versionRef}`);
  return `CHK_P620_${hashKey.slice(0, 8)}`;
}

export function generateDeterministicRecoveryId(
  checkpointId: string,
  targetSpaceId: string
): string {
  const hashKey = deterministicHash(`REC_${checkpointId}_${targetSpaceId}`);
  return `REC_P620_${hashKey.slice(0, 8)}`;
}

export function generateDeterministicSnapshotId(
  workspaceId: string,
  auditChecksum: string
): string {
  const hashKey = deterministicHash(`SNAP_AUD_${workspaceId}_${auditChecksum}`);
  return `SNAP_AUD_P620_${hashKey.slice(0, 8)}`;
}

export function generateDeterministicEventId(
  eventType: string,
  targetId: string,
  sequence: number
): string {
  const hashKey = deterministicHash(`EV_AUD_${eventType}_${targetId}_${sequence}`);
  return `EV_AUD_P620_${hashKey.slice(0, 8)}`;
}

export function generateDeterministicIssueId(
  code: string,
  entityId: string
): string {
  const hashKey = deterministicHash(`ISSUE_${code}_${entityId}`);
  return `ISS_P620_${hashKey.slice(0, 8)}`;
}

export function generateDeterministicLineageId(
  rootId: string,
  currentId: string,
  stepCount: number
): string {
  const hashKey = deterministicHash(`LIN_${rootId}_${currentId}_${stepCount}`);
  return `LIN_P620_${hashKey.slice(0, 8)}`;
}
