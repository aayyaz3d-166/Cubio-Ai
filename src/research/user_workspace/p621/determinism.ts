/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.21: Search Determinism Utilities
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

export function generateDeterministicIndexId(
  workspaceId: string,
  entryCount: number
): string {
  const hashKey = deterministicHash(`IDX_${workspaceId}_${entryCount}`);
  return `IDX_P621_${hashKey.slice(0, 8)}`;
}

export function generateDeterministicEntryId(
  sourceType: string,
  sourceId: string
): string {
  const hashKey = deterministicHash(`ENT_${sourceType}_${sourceId}`);
  return `ENT_IDX_${hashKey.slice(0, 8)}`;
}

export function generateDeterministicQueryId(
  term: string,
  scope: string,
  filterCount: number
): string {
  const hashKey = deterministicHash(`QRY_${term}_${scope}_${filterCount}`);
  return `QRY_P621_${hashKey.slice(0, 8)}`;
}

export function generateDeterministicResultId(
  sourceId: string,
  queryId: string
): string {
  const hashKey = deterministicHash(`RES_${sourceId}_${queryId}`);
  return `RES_P621_${hashKey.slice(0, 8)}`;
}

export function generateDeterministicSnapshotId(
  queryId: string,
  indexChecksum: string
): string {
  const hashKey = deterministicHash(`SNAP_SRCH_${queryId}_${indexChecksum}`);
  return `SNAP_SRCH_P621_${hashKey.slice(0, 8)}`;
}

export function generateDeterministicValidationId(
  targetId: string,
  status: string
): string {
  const hashKey = deterministicHash(`VAL_SRCH_${targetId}_${status}`);
  return `VAL_SRCH_P621_${hashKey.slice(0, 8)}`;
}
