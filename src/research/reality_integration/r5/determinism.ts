/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R5: Determinism Engine (sigma^2 = 0)
 *
 * Deterministic cryptographic hashing and identifier generators for spatial analysis.
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

export function generateDeterministicSpatialRelationId(
  sourceId: string,
  targetId: string,
  relationType: string,
  seq = 0
): string {
  const hash = deterministicHash(`SPATIAL_${sourceId}_${targetId}_${relationType}_seq_${seq}`);
  return `SREL_${hash}`;
}

export function generateDeterministicSpatialGraphId(stateId: string, seq = 0): string {
  const hash = deterministicHash(`SGRAPH_${stateId}_seq_${seq}`);
  return `SGRAPH_${hash}`;
}

export function generateDeterministicSpatialSnapshotId(stateId: string, seq = 0): string {
  const hash = deterministicHash(`SNAP_R5_${stateId}_seq_${seq}`);
  return `SNAP_R5_${hash}`;
}

export function computeSpatialRelationChecksum(
  relationId: string,
  sourceId: string,
  targetId: string,
  stateId: string,
  relationType: string,
  evidence: string,
  certainty: string,
  distance: number,
  direction: string,
  containment: string
): string {
  const raw = JSON.stringify([
    relationId,
    sourceId,
    targetId,
    stateId,
    relationType,
    evidence,
    certainty,
    Number(distance.toFixed(6)),
    direction,
    containment,
  ]);
  return `CS_SREL_${deterministicHash(raw)}`;
}

export function computeSpatialTopologyChecksum(
  graphId: string,
  stateId: string,
  nodeIds: readonly string[],
  edgeIds: readonly string[]
): string {
  const raw = JSON.stringify([
    graphId,
    stateId,
    [...nodeIds].sort(),
    [...edgeIds].sort(),
  ]);
  return `CS_SGRAPH_${deterministicHash(raw)}`;
}
