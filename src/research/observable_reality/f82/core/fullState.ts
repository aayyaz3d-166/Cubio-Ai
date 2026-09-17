/**
 * 3D Memory Studio — Funnel 82
 * Full State Data Model
 *
 * Implements complete simulated state available to the research experiment.
 */

import { FullState, FullStateObject, Coordinate4D, Vector4D } from '../types';

export function createFullStateObject(
  objectId: string,
  entityType: string,
  coordinates: Coordinate4D,
  velocity: Vector4D = [0, 0, 0, 0],
  relationships: readonly string[] = [],
  internalMetadata: Readonly<Record<string, unknown>> = {},
  hiddenPayload?: string,
  privateDimensions?: Readonly<Record<string, number>>,
  timestamp = 0
): FullStateObject {
  if (!objectId || objectId.trim() === '') {
    throw new Error('FullStateObject objectId cannot be empty');
  }

  return Object.freeze({
    objectId,
    entityType,
    coordinates: Object.freeze([...coordinates]) as unknown as Coordinate4D,
    velocity: Object.freeze([...velocity]) as unknown as Vector4D,
    relationships: Object.freeze([...relationships]),
    internalMetadata: Object.freeze({ ...internalMetadata }),
    hiddenPayload,
    privateDimensions: privateDimensions ? Object.freeze({ ...privateDimensions }) : undefined,
    timestamp,
  });
}

export function computeFullStateHash(
  stateId: string,
  frameIndex: number,
  dimension: number,
  objects: readonly FullStateObject[],
  globalParams: Readonly<Record<string, unknown>>
): string {
  const parts = [
    stateId,
    String(frameIndex),
    String(dimension),
    JSON.stringify(globalParams),
    ...objects.map((o) =>
      [
        o.objectId,
        o.entityType,
        o.coordinates.join(','),
        o.velocity.join(','),
        o.relationships.join(';'),
        JSON.stringify(o.internalMetadata),
        o.hiddenPayload || 'NOHIDDEN',
        JSON.stringify(o.privateDimensions || {}),
      ].join('|')
    ),
  ];

  let hash = 0x811c9dc5;
  const str = parts.join(':::');
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return `HASH_F82_STATE_${(hash >>> 0).toString(16).padStart(8, '0').toUpperCase()}`;
}

export function createFullState(
  stateId: string,
  frameIndex: number,
  objects: readonly FullStateObject[],
  globalParameters: Readonly<Record<string, unknown>> = {},
  dimension = 4,
  timestamp = Date.now()
): FullState {
  if (!stateId || stateId.trim() === '') {
    throw new Error('FullState stateId cannot be empty');
  }

  // Stable deterministic sorting by objectId
  const sortedObjects = Object.freeze(
    [...objects].sort((a, b) => a.objectId.localeCompare(b.objectId))
  );

  const stateHash = computeFullStateHash(
    stateId,
    frameIndex,
    dimension,
    sortedObjects,
    globalParameters
  );

  return Object.freeze({
    stateId,
    dimension,
    frameIndex,
    timestamp,
    objects: sortedObjects,
    globalParameters: Object.freeze({ ...globalParameters }),
    stateHash,
  });
}
