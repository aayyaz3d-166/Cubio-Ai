/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.24: Portability Determinism Utilities
 *
 * Enforces pure cryptographic determinism (σ² = 0) across all
 * export packages, manifests, preview hashes, and import transactions.
 */

export function deterministicHash(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function generateDeterministicPackageId(
  sourceOwnerId: string,
  scope: string,
  entityCount: number
): string {
  const hashKey = deterministicHash(`PKG_${sourceOwnerId}_${scope}_${entityCount}`);
  return `PKG_P624_${hashKey.slice(0, 8)}`;
}

export function generateDeterministicManifestId(packageId: string): string {
  const hashKey = deterministicHash(`MAN_${packageId}`);
  return `MAN_P624_${hashKey.slice(0, 8)}`;
}

export function generateDeterministicImportTxId(
  packageId: string,
  targetWorkspaceId: string
): string {
  const hashKey = deterministicHash(`TX_IMP_${packageId}_${targetWorkspaceId}`);
  return `TX_IMP_P624_${hashKey.slice(0, 8)}`;
}

export function generateDeterministicSnapshotId(
  packageId: string,
  manifestChecksum: string
): string {
  const hashKey = deterministicHash(`SNAP_PORT_${packageId}_${manifestChecksum}`);
  return `SNAP_PORT_P624_${hashKey.slice(0, 8)}`;
}

export function generateDeterministicConflictId(
  entityId: string,
  conflictType: string
): string {
  const hashKey = deterministicHash(`CONF_${entityId}_${conflictType}`);
  return `CONF_P624_${hashKey.slice(0, 8)}`;
}

export function generateDeterministicPreviewId(packageId: string): string {
  const hashKey = deterministicHash(`PREV_${packageId}`);
  return `PREV_P624_${hashKey.slice(0, 8)}`;
}

export function generateDeterministicEntityChecksum(data: unknown): string {
  return deterministicHash(JSON.stringify(data));
}

export function generateDeterministicPackageChecksum(
  manifestChecksum: string,
  entityChecksums: readonly string[]
): string {
  return deterministicHash(JSON.stringify([manifestChecksum, entityChecksums]));
}
