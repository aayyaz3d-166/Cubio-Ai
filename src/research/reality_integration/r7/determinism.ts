/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R7: Determinism Engine (sigma^2 = 0)
 *
 * Deterministic cryptographic hashing and identifier generators for R7 3D Visualization.
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

export function generateDeterministicVisualObjectId(workspaceObjectId: string): string {
  const hash = deterministicHash(`VOBJ_${workspaceObjectId}`);
  return `VOBJ_${hash}`;
}

export function generateDeterministicVisualRelationshipId(workspaceRelId: string): string {
  const hash = deterministicHash(`VREL_${workspaceRelId}`);
  return `VREL_${hash}`;
}

export function generateDeterministicVisualSpatialId(workspaceSpatialId: string): string {
  const hash = deterministicHash(`VSPATIAL_${workspaceSpatialId}`);
  return `VSPATIAL_${hash}`;
}

export function generateDeterministicVisualTopologyEdgeId(sourceId: string, targetId: string): string {
  const hash = deterministicHash(`VEDGE_${sourceId}_${targetId}`);
  return `VEDGE_${hash}`;
}

export function generateDeterministicSceneId(workspaceId: string, seq = 0): string {
  const hash = deterministicHash(`SCENE_${workspaceId}_seq_${seq}`);
  return `SCENE_${hash}`;
}

export function generateDeterministicVisualizationSnapshotId(sceneId: string, seq = 0): string {
  const hash = deterministicHash(`SNAP_R7_${sceneId}_seq_${seq}`);
  return `SNAP_R7_${hash}`;
}

export function computeVisualObjectChecksum(
  visualObjectId: string,
  workspaceObjectId: string,
  realityObjectId: string,
  coords: readonly [number, number, number],
  dims?: readonly [number, number, number],
  primitiveType: string = 'BOX',
  sourceChecksum: string = ''
): string {
  const raw = JSON.stringify([
    visualObjectId,
    workspaceObjectId,
    realityObjectId,
    coords,
    dims,
    primitiveType,
    sourceChecksum,
  ]);
  return `CS_VOBJ_${deterministicHash(raw)}`;
}

export function computeVisualRelationshipChecksum(
  visualRelId: string,
  workspaceRelId: string,
  srcVObjId: string,
  tgtVObjId: string,
  relType: string,
  evidence: string
): string {
  const raw = JSON.stringify([
    visualRelId,
    workspaceRelId,
    srcVObjId,
    tgtVObjId,
    relType,
    evidence,
  ]);
  return `CS_VREL_${deterministicHash(raw)}`;
}

export function computeVisualSpatialChecksum(
  visualSpatialId: string,
  workspaceSpatialId: string,
  srcVObjId: string,
  tgtVObjId: string,
  relType: string,
  distance: number,
  direction: string
): string {
  const raw = JSON.stringify([
    visualSpatialId,
    workspaceSpatialId,
    srcVObjId,
    tgtVObjId,
    relType,
    Number(distance.toFixed(6)),
    direction,
  ]);
  return `CS_VSPATIAL_${deterministicHash(raw)}`;
}

export function computeSceneChecksum(
  sceneId: string,
  workspaceId: string,
  nodeChecksums: readonly string[],
  relChecksums: readonly string[],
  spatialChecksums: readonly string[],
  edgeChecksums: readonly string[]
): string {
  const raw = JSON.stringify([
    sceneId,
    workspaceId,
    [...nodeChecksums].sort(),
    [...relChecksums].sort(),
    [...spatialChecksums].sort(),
    [...edgeChecksums].sort(),
  ]);
  return `CS_SCENE_${deterministicHash(raw)}`;
}
