/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R4: Determinism Engine (sigma^2 = 0)
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

export function generateDeterministicObjectId(stateId: string, tag: string, sequence = 0): string {
  const hash = deterministicHash(`ROBJ_${stateId}_${tag}_seq_${sequence}`);
  return `ROBJ_${hash}`;
}

export function generateDeterministicObjectLineageId(rootId: string, parentId: string | null, version: number): string {
  const hash = deterministicHash(`OBJLIN_${rootId}_${parentId ?? 'ROOT'}_v${version}`);
  return `OBJLIN_${hash}`;
}

export function generateDeterministicRelationshipId(sourceId: string, targetId: string, type: string, seq = 0): string {
  const hash = deterministicHash(`REL_${sourceId}_${targetId}_${type}_seq_${seq}`);
  return `REL_${hash}`;
}

export function generateDeterministicCollectionId(stateId: string, seq = 0): string {
  const hash = deterministicHash(`COLL_R4_${stateId}_seq_${seq}`);
  return `COLL_R4_${hash}`;
}

export function generateDeterministicMultiObjectSnapshotId(stateId: string, seq = 0): string {
  const hash = deterministicHash(`SNAP_R4_${stateId}_seq_${seq}`);
  return `SNAP_R4_${hash}`;
}

export function computeObjectChecksum(
  objectId: string,
  stateId: string,
  stateChecksum: string,
  objectType: string,
  coordinates: readonly [number, number, number] | undefined,
  dimensions: readonly [number, number, number] | undefined,
  certainty: string,
  origin: string,
  version: number
): string {
  const raw = JSON.stringify([
    objectId,
    stateId,
    stateChecksum,
    objectType,
    coordinates ? [coordinates[0], coordinates[1], coordinates[2]] : null,
    dimensions ? [dimensions[0], dimensions[1], dimensions[2]] : null,
    certainty,
    origin,
    version,
  ]);
  return `CS_ROBJ_${deterministicHash(raw)}`;
}

export function computeRelationshipChecksum(
  relationshipId: string,
  sourceObjectId: string,
  targetObjectId: string,
  type: string,
  evidence: string,
  certainty: string,
  targetStateId: string
): string {
  const raw = JSON.stringify([
    relationshipId,
    sourceObjectId,
    targetObjectId,
    type,
    evidence,
    certainty,
    targetStateId,
  ]);
  return `CS_REL_${deterministicHash(raw)}`;
}

export function computeCollectionChecksum(
  collectionId: string,
  stateId: string,
  objectChecksums: readonly string[],
  relationshipChecksums: readonly string[]
): string {
  const raw = JSON.stringify([
    collectionId,
    stateId,
    objectChecksums,
    relationshipChecksums,
  ]);
  return `CS_COLL_${deterministicHash(raw)}`;
}
