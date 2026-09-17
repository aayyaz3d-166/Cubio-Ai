/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R1: Determinism Engine (sigma^2 = 0)
 *
 * Cryptographic hashing and deterministic ID generators.
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

export function generateDeterministicRealityId(tag: string, sequence = 0): string {
  const hash = deterministicHash(`REALITY_${tag}_${sequence}`);
  return `REAL_${hash}`;
}

export function generateDeterministicRealityStateId(realityId: string, sequence = 0): string {
  const hash = deterministicHash(`RSTATE_${realityId}_${sequence}`);
  return `RST_${hash}`;
}

export function generateDeterministicModelId(realityStateId: string): string {
  const hash = deterministicHash(`MDL_${realityStateId}`);
  return `MDL_${hash}`;
}

export function generateDeterministicGeometryId(modelId: string): string {
  const hash = deterministicHash(`GEO_${modelId}`);
  return `GEO_${hash}`;
}

export function generateDeterministicWorkspaceRefId(geometryId: string): string {
  const hash = deterministicHash(`WSREF_${geometryId}`);
  return `WSREF_${hash}`;
}

export function generateDeterministicEventId(domain: string, seq: number): string {
  const hash = deterministicHash(`EVT_R1_${domain}_${seq}`);
  return `EVT_R1_${hash}`;
}

export function generateDeterministicSnapshotId(realityStateId: string): string {
  const hash = deterministicHash(`SNAP_R1_${realityStateId}`);
  return `SNAP_R1_${hash}`;
}

export function computeRealityChecksum(
  realityId: string,
  coordinates: readonly [number, number, number],
  dimensions: readonly [number, number, number],
  certainty: string,
  lineageId: string
): string {
  const raw = JSON.stringify([
    realityId,
    coordinates[0],
    coordinates[1],
    coordinates[2],
    dimensions[0],
    dimensions[1],
    dimensions[2],
    certainty,
    lineageId,
  ]);
  return `CS_REAL_${deterministicHash(raw)}`;
}

export function computeModelChecksum(
  modelId: string,
  sourceRealityId: string,
  coordinates: readonly [number, number, number],
  dimensions: readonly [number, number, number],
  certainty: string
): string {
  const raw = JSON.stringify([
    modelId,
    sourceRealityId,
    coordinates,
    dimensions,
    certainty,
  ]);
  return `CS_MDL_${deterministicHash(raw)}`;
}

export function computeGeometryChecksum(
  geometryId: string,
  sourceModelId: string,
  coordinates: readonly [number, number, number],
  dimensions: readonly [number, number, number],
  originClassification: string
): string {
  const raw = JSON.stringify([
    geometryId,
    sourceModelId,
    coordinates,
    dimensions,
    originClassification,
  ]);
  return `CS_GEO_${deterministicHash(raw)}`;
}

export function computeWorkspaceChecksum(
  workspaceSpaceId: string,
  sourceGeometryId: string,
  coordinates: readonly [number, number, number],
  dimensions: readonly [number, number, number]
): string {
  const raw = JSON.stringify([
    workspaceSpaceId,
    sourceGeometryId,
    coordinates,
    dimensions,
  ]);
  return `CS_WS_${deterministicHash(raw)}`;
}
