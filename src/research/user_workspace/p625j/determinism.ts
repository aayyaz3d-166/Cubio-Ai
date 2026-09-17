/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.25-J: Determinism Engine (sigma^2 = 0)
 */

export function deterministicHash(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
    hash >>>= 0;
  }
  return hash.toString(16).padStart(8, '0');
}

export function generateDeterministicSceneId(spaceId: string, sequence: number = 0): string {
  const hash = deterministicHash(`${spaceId}_SCENE_${sequence}`);
  return `SCN_P625J_${hash}`;
}

export function generateDeterministicGeometryObjectId(
  spaceId: string,
  type: string,
  sequence: number = 0
): string {
  const hash = deterministicHash(`${spaceId}_${type}_${sequence}`);
  return `GEO_P625J_${hash}`;
}

export function generateDeterministicEventId(domain: string, sequence: number): string {
  const hash = deterministicHash(`${domain}_${sequence}`);
  return `EVT_P625J_${hash}`;
}

export function generateDeterministicSnapshotId(spaceId: string, label: string): string {
  const hash = deterministicHash(`${spaceId}_${label}`);
  return `SNAP_P625J_${hash}`;
}

export function computeObjectChecksum(obj: {
  objectId: string;
  name: string;
  geometryType: string;
  coordinates: readonly [number, number, number];
  dimensions: readonly [number, number, number];
  bounds: {
    min: readonly [number, number, number];
    max: readonly [number, number, number];
  };
}): string {
  const raw = [
    obj.objectId,
    obj.name,
    obj.geometryType,
    obj.coordinates.join(','),
    obj.dimensions.join(','),
    obj.bounds.min.join(','),
    obj.bounds.max.join(','),
  ].join('|');
  return `CS_GEO_${deterministicHash(raw)}`;
}

export function computeSceneChecksum(
  sceneId: string,
  spaceId: string,
  objects: readonly { geometryChecksum: string }[]
): string {
  const objHashes = objects.map((o) => o.geometryChecksum).sort().join(';');
  const raw = `${sceneId}|${spaceId}|${objHashes}`;
  return `CS_SCENE_${deterministicHash(raw)}`;
}
