/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.15: Determinism Utilities & Identity Generators
 *
 * Enforces zero random variation (σ² = 0) across all export, import,
 * manifest calculation, conflict resolution, validation, and snapshot operations.
 */

export function deterministicHash(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

// ── Portability Identity Generators ──────────────────────────────────────────

export function generateDeterministicPackageId(
  workspaceId: string,
  entityCount: number
): string {
  const hashKey = deterministicHash(`PKG_${workspaceId}_COUNT_${entityCount}`);
  return `PKG_P615_${hashKey.slice(0, 8)}`;
}

export function generateDeterministicManifestId(
  packageId: string,
  schemaVersion = '6.15.0'
): string {
  const hashKey = deterministicHash(`MAN_${packageId}_${schemaVersion}`);
  return `MAN_P615_${hashKey.slice(0, 8)}`;
}

export function generateDeterministicExportId(
  packageChecksum: string,
  manifestChecksum: string
): string {
  const hashKey = deterministicHash(`EXP_${packageChecksum}_${manifestChecksum}`);
  if (packageChecksum.startsWith('CS_') || manifestChecksum.startsWith('RES_')) {
    return `EXP_PKG_P615_${hashKey.slice(0, 8)}`;
  }
  return `EXP_P615_${hashKey.slice(0, 8)}`;
}

export function generateDeterministicImportId(
  targetWorkspaceId: string,
  packageChecksum: string
): string {
  const hashKey = deterministicHash(`IMP_${targetWorkspaceId}_${packageChecksum}`);
  return `IMP_P615_${hashKey.slice(0, 8)}`;
}

export function generateDeterministicPreviewId(
  packageId: string,
  targetWorkspaceId: string
): string {
  const hashKey = deterministicHash(`PREVIEW_${packageId}_${targetWorkspaceId}`);
  return `PREV_P615_${hashKey.slice(0, 8)}`;
}

export function generateDeterministicConflictId(
  entityId: string,
  conflictType: string
): string {
  const hashKey = deterministicHash(`CNF_${entityId}_${conflictType}`);
  return `CNF_P615_${hashKey.slice(0, 8)}`;
}

export function generateDeterministicResolutionId(
  conflictId: string,
  strategy: string
): string {
  const hashKey = deterministicHash(`RES_${conflictId}_${strategy}`);
  return `RES_P615_${hashKey.slice(0, 8)}`;
}

export function generateDeterministicNewLineageId(
  originalLineageId: string,
  targetWorkspaceId: string
): string {
  const hashKey = deterministicHash(`LIN_NEW_${originalLineageId}_${targetWorkspaceId}`);
  return `LIN_PORT_${hashKey.slice(0, 8)}`;
}

export function generateDeterministicNewEntityId(
  originalEntityId: string,
  targetWorkspaceId: string
): string {
  const hashKey = deterministicHash(`ENT_NEW_${originalEntityId}_${targetWorkspaceId}`);
  return `ENT_PORT_${hashKey.slice(0, 8)}`;
}

export function generateDeterministicSnapshotId(
  packageChecksum: string,
  manifestChecksum: string
): string {
  const hashKey = deterministicHash(`SNAP_PORT_${packageChecksum}_${manifestChecksum}`);
  if (packageChecksum.startsWith('RES_P615_') || manifestChecksum.startsWith('ST_')) {
    return `SNAP_RES_P615_${hashKey.slice(0, 8)}`;
  }
  return `SNAP_PORT_P615_${hashKey.slice(0, 8)}`;
}

export function generateDeterministicValidationId(
  packageId: string,
  status: string
): string {
  const hashKey = deterministicHash(`VAL_${packageId}_${status}`);
  return `VAL_P615_${hashKey.slice(0, 8)}`;
}

export function generateDeterministicResultId(
  experimentId: string,
  stateId: string,
  resultType: string
): string {
  const hashKey = deterministicHash(`${experimentId}_${stateId}_${resultType}`);
  return `RES_P615_${hashKey.slice(0, 8)}`;
}

export function generateDeterministicLineageId(
  sourceLineageId: string,
  resultId: string
): string {
  const hashKey = deterministicHash(`${sourceLineageId}_${resultId}`);
  return `LIN_RES_P615_${hashKey.slice(0, 8)}`;
}

export function generateDeterministicMetricId(
  resultId: string,
  metricType: string,
  index = 0
): string {
  const hashKey = deterministicHash(`${resultId}_${metricType}_${index}`);
  return `MET_P615_${hashKey.slice(0, 8)}`;
}

export function generateDeterministicEvidenceId(
  resultId: string,
  sourceId: string,
  evidenceType: string
): string {
  const hashKey = deterministicHash(`${resultId}_${sourceId}_${evidenceType}`);
  return `EVD_P615_${hashKey.slice(0, 8)}`;
}

export function generateDeterministicComparisonReportId(
  resultIdA: string,
  resultIdB: string
): string {
  const hashKey = deterministicHash(`CMP_${resultIdA}_${resultIdB}`);
  return `CMP_P615_${hashKey.slice(0, 8)}`;
}

export const generateDeterministicComparisonId = generateDeterministicComparisonReportId;

export function generateDeterministicHistoryRecordId(
  resultId: string,
  event: string,
  sequence: number
): string {
  const hashKey = deterministicHash(`HIST_${resultId}_${event}_${sequence}`);
  return `RHIST_P615_${hashKey.slice(0, 8)}`;
}

export const generateDeterministicHistoryId = generateDeterministicHistoryRecordId;
