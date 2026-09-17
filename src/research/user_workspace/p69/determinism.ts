/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.9: Determinism Utilities & Identity Generators
 *
 * Enforces zero random variation (σ² = 0) across all Export, Import, Clone, and Share operations.
 */

export function deterministicHash(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function generateDeterministicExportId(spaceId: string, count: number): string {
  const hashKey = deterministicHash(`${spaceId}_EXPORT_${count}`);
  return `EXP_PKG_P69_${hashKey.slice(0, 8)}`;
}

export function generateDeterministicImportId(sourceSpaceId: string, count: number): string {
  const hashKey = deterministicHash(`${sourceSpaceId}_IMPORT_${count}`);
  return `SPACE_P69_IMP_${hashKey.slice(0, 8)}`;
}

export function generateDeterministicCloneId(sourceSpaceId: string, count: number): string {
  const hashKey = deterministicHash(`${sourceSpaceId}_CLONE_${count}`);
  return `SPACE_P69_CLN_${hashKey.slice(0, 8)}`;
}

export function generateDeterministicSharePackageId(sourceSpaceId: string, count: number): string {
  const hashKey = deterministicHash(`${sourceSpaceId}_SHARE_${count}`);
  return `SHARE_P69_${hashKey.slice(0, 8)}`;
}

export function generateDeterministicProvenanceId(sourceSpaceId: string, count: number): string {
  const hashKey = deterministicHash(`${sourceSpaceId}_PROV_${count}`);
  return `PROV_P69_${hashKey.slice(0, 8)}`;
}
