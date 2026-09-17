/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R6: Determinism Engine (sigma^2 = 0)
 *
 * Deterministic cryptographic hashing and identifier generators for Reality-to-Workspace integration.
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

export function generateDeterministicWorkspaceId(realityStateId: string, seq = 0): string {
  const hash = deterministicHash(`WS_${realityStateId}_seq_${seq}`);
  return `WS_${hash}`;
}

export function generateDeterministicWorkspaceObjectId(realityObjectId: string): string {
  const hash = deterministicHash(`WOBJ_${realityObjectId}`);
  return `WOBJ_${hash}`;
}

export function generateDeterministicWorkspaceRelationshipId(realityRelationshipId: string): string {
  const hash = deterministicHash(`WREL_${realityRelationshipId}`);
  return `WREL_${hash}`;
}

export function generateDeterministicWorkspaceSpatialId(realitySpatialId: string): string {
  const hash = deterministicHash(`WSPATIAL_${realitySpatialId}`);
  return `WSPATIAL_${hash}`;
}

export function generateDeterministicWorkspaceTopologyId(realityTopologyId: string): string {
  const hash = deterministicHash(`WTOPOLOGY_${realityTopologyId}`);
  return `WTOPOLOGY_${hash}`;
}

export function generateDeterministicWorkspaceSnapshotId(workspaceId: string, seq = 0): string {
  const hash = deterministicHash(`SNAP_R6_${workspaceId}_seq_${seq}`);
  return `SNAP_R6_${hash}`;
}

export function computeWorkspaceObjectChecksum(
  workspaceObjectId: string,
  realityObjectId: string,
  realityStateId: string,
  sourceChecksum: string,
  coords?: readonly [number, number, number],
  dims?: readonly [number, number, number]
): string {
  const raw = JSON.stringify([
    workspaceObjectId,
    realityObjectId,
    realityStateId,
    sourceChecksum,
    coords,
    dims,
  ]);
  return `CS_WOBJ_${deterministicHash(raw)}`;
}

export function computeWorkspaceRelationshipChecksum(
  workspaceRelId: string,
  realityRelId: string,
  srcWObjId: string,
  tgtWObjId: string,
  relType: string,
  sourceChecksum: string
): string {
  const raw = JSON.stringify([
    workspaceRelId,
    realityRelId,
    srcWObjId,
    tgtWObjId,
    relType,
    sourceChecksum,
  ]);
  return `CS_WREL_${deterministicHash(raw)}`;
}

export function computeWorkspaceSpatialChecksum(
  workspaceSpatialId: string,
  realitySpatialId: string,
  srcWObjId: string,
  tgtWObjId: string,
  relType: string,
  distance: number,
  direction: string,
  sourceChecksum: string
): string {
  const raw = JSON.stringify([
    workspaceSpatialId,
    realitySpatialId,
    srcWObjId,
    tgtWObjId,
    relType,
    Number(distance.toFixed(6)),
    direction,
    sourceChecksum,
  ]);
  return `CS_WSPATIAL_${deterministicHash(raw)}`;
}

export function computeWorkspaceTopologyChecksum(
  workspaceTopoId: string,
  realityTopoId: string,
  nodeCount: number,
  edgeCount: number,
  sourceChecksum: string
): string {
  const raw = JSON.stringify([
    workspaceTopoId,
    realityTopoId,
    nodeCount,
    edgeCount,
    sourceChecksum,
  ]);
  return `CS_WTOPOLOGY_${deterministicHash(raw)}`;
}

export function computeWorkspaceChecksum(
  workspaceId: string,
  realityStateId: string,
  realityStateChecksum: string,
  objectChecksums: readonly string[],
  relationshipChecksums: readonly string[],
  spatialChecksums: readonly string[],
  topologyChecksum: string | null,
  selectionId: string | null,
  cameraZoom: number
): string {
  const raw = JSON.stringify([
    workspaceId,
    realityStateId,
    realityStateChecksum,
    [...objectChecksums].sort(),
    [...relationshipChecksums].sort(),
    [...spatialChecksums].sort(),
    topologyChecksum,
    selectionId,
    Number(cameraZoom.toFixed(4)),
  ]);
  return `CS_WS_${deterministicHash(raw)}`;
}
