/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R8: Determinism Engine (sigma^2 = 0)
 *
 * Deterministic cryptographic hashing and identifier generators for R8 3D Interaction.
 */

export function deterministicHash(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  const unsigned = hash >>> 0;
  return unsigned.toString(16).padStart(8, '0');
}

export function generateDeterministicSessionId(workspaceId: string, seq = 0): string {
  const hash = deterministicHash(`SESS_R8_${workspaceId}_seq_${seq}`);
  return `SESS_R8_${hash}`;
}

export function generateDeterministicSelectionId(sessionId: string, seq = 0): string {
  const hash = deterministicHash(`SEL_R8_${sessionId}_seq_${seq}`);
  return `SEL_R8_${hash}`;
}

export function generateDeterministicOperationId(sessionId: string, opType: string, seq = 0): string {
  const hash = deterministicHash(`OP_R8_${sessionId}_${opType}_seq_${seq}`);
  return `OP_R8_${hash}`;
}

export function generateDeterministicPreviewId(sessionId: string, targetId: string, seq = 0): string {
  const hash = deterministicHash(`PREV_R8_${sessionId}_${targetId}_seq_${seq}`);
  return `PREV_R8_${hash}`;
}

export function generateDeterministicCommitId(targetId: string, seq = 0): string {
  const hash = deterministicHash(`COMMIT_R8_${targetId}_seq_${seq}`);
  return `COMMIT_R8_${hash}`;
}

export function generateDeterministicHistoryEntryId(sessionId: string, seq = 0): string {
  const hash = deterministicHash(`HIST_R8_${sessionId}_seq_${seq}`);
  return `HIST_R8_${hash}`;
}

export function generateDeterministicSnapshotId(sessionId: string, seq = 0): string {
  const hash = deterministicHash(`SNAP_R8_${sessionId}_seq_${seq}`);
  return `SNAP_R8_${hash}`;
}

export function generateDeterministicLineageId(sessionId: string, targetId: string): string {
  const hash = deterministicHash(`LIN_R8_${sessionId}_${targetId}`);
  return `LIN_R8_${hash}`;
}

export function computeTransformChecksum(
  translation: readonly [number, number, number],
  rotation: readonly [number, number, number],
  scale: readonly [number, number, number]
): string {
  const raw = JSON.stringify([
    translation.map((n) => Number(n.toFixed(6))),
    rotation.map((n) => Number(n.toFixed(6))),
    scale.map((n) => Number(n.toFixed(6))),
  ]);
  return `CS_XFORM_${deterministicHash(raw)}`;
}

export function computeSelectionChecksum(
  selectionId: string,
  selectedObjectIds: readonly string[],
  primarySelectedObjectId: string | null,
  selectionMode: string
): string {
  const raw = JSON.stringify([
    selectionId,
    [...selectedObjectIds].sort(),
    primarySelectedObjectId,
    selectionMode,
  ]);
  return `CS_SEL_${deterministicHash(raw)}`;
}

export function computeSessionChecksum(
  sessionId: string,
  state: string,
  targetCount: number,
  selectedCount: number,
  historyCount: number,
  previewActive: boolean
): string {
  const raw = JSON.stringify([
    sessionId,
    state,
    targetCount,
    selectedCount,
    historyCount,
    previewActive,
  ]);
  return `CS_SESS_${deterministicHash(raw)}`;
}
