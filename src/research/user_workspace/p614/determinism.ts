/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.14: Determinism Utilities & Identity Generators
 *
 * Enforces zero random variation (σ² = 0) across all indexing, search,
 * ranking, navigation, and snapshot operations.
 */

export function deterministicHash(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

// ── Search & Indexing Identity Generators ──────────────────────────────────────

export function generateDeterministicIndexId(
  workspaceId: string,
  entityCount: number
): string {
  const hashKey = deterministicHash(`IDX_${workspaceId}_COUNT_${entityCount}`);
  return `IDX_P614_${hashKey.slice(0, 8)}`;
}

export function generateDeterministicQuerySignature(
  text: string,
  scope: string,
  filter?: unknown,
  sort?: unknown,
  offset = 0,
  limit = 50
): string {
  const raw = JSON.stringify([
    text.trim().toLowerCase(),
    scope,
    filter ?? null,
    sort ?? null,
    offset,
    limit,
  ]);
  return `QSIG_P614_${deterministicHash(raw)}`;
}

export function generateDeterministicSearchResultId(
  querySignature: string,
  entityId: string
): string {
  return `SRES_P614_${deterministicHash(`${querySignature}_${entityId}`)}`;
}

export function generateDeterministicNavigationId(
  userId: string,
  targetEntityId: string
): string {
  return `NAV_P614_${deterministicHash(`NAV_${userId}_${targetEntityId}`)}`;
}

export function generateDeterministicSearchSnapshotId(
  indexChecksum: string,
  querySignature: string
): string {
  return `SNAP_SRCH_P614_${deterministicHash(`SSNAP_${indexChecksum}_${querySignature}`)}`;
}

export function generateDeterministicSearchHistoryId(
  userId: string,
  event: string,
  sequence: number
): string {
  return `SHIST_P614_${deterministicHash(`${userId}_${event}_${sequence}`)}`;
}

export function generateDeterministicSearchExportId(
  indexChecksum: string,
  querySignature: string
): string {
  return `SEXP_PKG_P614_${deterministicHash(`EXP_${indexChecksum}_${querySignature}`)}`;
}

export function generateDeterministicEntityLineageId(
  sourceLineageId: string,
  entityId: string
): string {
  return `LIN_ENT_P614_${deterministicHash(`${sourceLineageId}_${entityId}`)}`;
}

// ── Backward Compatible Experiment Generators ──────────────────────────────────

export function generateDeterministicExperimentId(
  spaceId: string,
  versionId: string,
  experimentIndex: number,
  type: string
): string {
  const hashKey = deterministicHash(`${spaceId}_${versionId}_EXP${experimentIndex}_${type}`);
  return `EXP_P614_${hashKey.slice(0, 8)}`;
}

export function generateDeterministicStateId(
  experimentId: string,
  sequenceNumber: number,
  operation: string
): string {
  const hashKey = deterministicHash(`${experimentId}_SEQ${sequenceNumber}_${operation}`);
  return `ST_P614_${hashKey.slice(0, 8)}`;
}

export function generateDeterministicBranchId(
  experimentId: string,
  parentStateId: string,
  branchName: string
): string {
  const hashKey = deterministicHash(`${experimentId}_${parentStateId}_BRN_${branchName}`);
  return `EXP_BRN_P614_${hashKey.slice(0, 8)}`;
}

export function generateDeterministicLineageId(
  sourceLineageId: string,
  experimentId: string
): string {
  const hashKey = deterministicHash(`${sourceLineageId}_${experimentId}`);
  return `LIN_EXP_P614_${hashKey.slice(0, 8)}`;
}

export function generateDeterministicSnapshotId(
  experimentId: string,
  stateId: string
): string {
  const hashKey = deterministicHash(`SNAP_${experimentId}_${stateId}`);
  return `SNAP_EXP_P614_${hashKey.slice(0, 8)}`;
}

export function generateDeterministicCommitId(
  spaceId: string,
  experimentId: string,
  stateId: string
): string {
  const hashKey = deterministicHash(`COMMIT_${spaceId}_${experimentId}_${stateId}`);
  return `CMT_P614_${hashKey.slice(0, 8)}`;
}

export function generateDeterministicComparisonId(
  stateIdA: string,
  stateIdB: string
): string {
  const hashKey = deterministicHash(`CMP_${stateIdA}_${stateIdB}`);
  return `CMP_P614_${hashKey.slice(0, 8)}`;
}
