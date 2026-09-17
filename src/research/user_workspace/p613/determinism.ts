/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.13: Determinism Utilities & Version Identity Generators
 *
 * Enforces zero random variation (σ² = 0) across all versioning and timeline operations.
 */

export function deterministicHash(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function generateDeterministicVersionId(
  workspaceId: string,
  versionIndex: number,
  versionType: string
): string {
  const hashKey = deterministicHash(`${workspaceId}_V${versionIndex}_${versionType}`);
  return `VER_P613_${hashKey.slice(0, 8)}`;
}

export function generateDeterministicLineageId(
  workspaceId: string,
  parentLineageId: string | null,
  versionId: string
): string {
  const hashKey = deterministicHash(`${workspaceId}_${parentLineageId || 'ROOT'}_${versionId}`);
  return `LIN_VER_P613_${hashKey.slice(0, 8)}`;
}

export function generateDeterministicBranchId(
  workspaceId: string,
  parentVersionId: string,
  branchName: string
): string {
  const hashKey = deterministicHash(`${workspaceId}_${parentVersionId}_BRANCH_${branchName}`);
  return `BRN_P613_${hashKey.slice(0, 8)}`;
}

export function generateDeterministicDiffId(versionIdA: string, versionIdB: string): string {
  const hashKey = deterministicHash(`DIFF_${versionIdA}_${versionIdB}`);
  return `DIFF_P613_${hashKey.slice(0, 8)}`;
}

export function generateDeterministicSnapshotId(versionId: string): string {
  const hashKey = deterministicHash(`SNAP_${versionId}`);
  return `SNAP_VER_P613_${hashKey.slice(0, 8)}`;
}

export function generateDeterministicEventId(
  workspaceId: string,
  versionId: string,
  eventType: string
): string {
  const hashKey = deterministicHash(`${workspaceId}_${versionId}_${eventType}`);
  return `EVT_VER_P613_${hashKey.slice(0, 8)}`;
}
