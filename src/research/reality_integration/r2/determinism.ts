/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R2: Determinism Engine (sigma^2 = 0)
 *
 * Provides deterministic hashing, entity ID generation, and checksum computation.
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

export function generateDeterministicStateId(tag: string, version = 1, sequence = 0): string {
  const hash = deterministicHash(`R2_STATE_${tag}_v${version}_s${sequence}`);
  return `RST_${hash}`;
}

export function generateDeterministicLineageId(rootId: string, parentId: string | null, version: number): string {
  const hash = deterministicHash(`LIN_${rootId}_${parentId ?? 'ROOT'}_v${version}`);
  return `LIN_${hash}`;
}

export function generateDeterministicTransitionId(sourceId: string | null, targetId: string, type: string): string {
  const hash = deterministicHash(`TRANS_${sourceId ?? 'INIT'}_TO_${targetId}_${type}`);
  return `TRN_${hash}`;
}

export function generateDeterministicMutationId(sourceId: string, reason: string): string {
  const hash = deterministicHash(`MUT_${sourceId}_${reason}`);
  return `MUT_${hash}`;
}

export function generateDeterministicSnapshotId(stateId: string, checksum: string): string {
  const hash = deterministicHash(`SNAP_R2_${stateId}_${checksum}`);
  return `SNAP_R2_${hash}`;
}

export function generateDeterministicEventId(domain: string, sequence: number): string {
  const hash = deterministicHash(`EVT_R2_${domain}_${sequence}`);
  return `EVT_R2_${hash}`;
}

export function computeRealityStateChecksum(
  stateId: string,
  version: number,
  coordinates: readonly [number, number, number],
  dimensions: readonly [number, number, number],
  certainty: string,
  origin: string,
  lineageId: string
): string {
  const raw = JSON.stringify([
    stateId,
    version,
    coordinates[0],
    coordinates[1],
    coordinates[2],
    dimensions[0],
    dimensions[1],
    dimensions[2],
    certainty,
    origin,
    lineageId,
  ]);
  return `CS_R2_${deterministicHash(raw)}`;
}

export function computeR2ModelChecksum(
  modelId: string,
  sourceRealityStateId: string,
  coordinates: readonly [number, number, number],
  dimensions: readonly [number, number, number],
  certainty: string
): string {
  const raw = JSON.stringify([
    modelId,
    sourceRealityStateId,
    coordinates,
    dimensions,
    certainty,
  ]);
  return `CS_MDL_R2_${deterministicHash(raw)}`;
}

export function computeR2GeometryChecksum(
  geometryId: string,
  sourceModelId: string,
  coordinates: readonly [number, number, number],
  dimensions: readonly [number, number, number],
  origin: string
): string {
  const raw = JSON.stringify([
    geometryId,
    sourceModelId,
    coordinates,
    dimensions,
    origin,
  ]);
  return `CS_GEO_R2_${deterministicHash(raw)}`;
}

export function computeR2WorkspaceChecksum(
  spaceId: string,
  sourceGeometryId: string,
  coordinates: readonly [number, number, number],
  dimensions: readonly [number, number, number]
): string {
  const raw = JSON.stringify([
    spaceId,
    sourceGeometryId,
    coordinates,
    dimensions,
  ]);
  return `CS_WS_R2_${deterministicHash(raw)}`;
}
