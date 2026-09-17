/**
 * 3D Memory Studio — Funnel 82
 * Deterministic Hashes for Representations & Frames
 */

import { ObservableObject, ObservationFrameObject } from '../types';

export function computeRepresentationHash(
  sourceStateId: string,
  sourceStateHash: string,
  observerId: string,
  projectionType: string,
  objects: readonly ObservableObject[]
): string {
  const parts = [
    sourceStateId,
    sourceStateHash,
    observerId,
    projectionType,
    ...objects.map((o) =>
      [
        o.objectId,
        o.entityType,
        o.projectedPosition.join(','),
        JSON.stringify(o.visibleProperties),
        o.visibleGeometry.shape,
        o.visibleGeometry.apparentScale.toFixed(4),
        o.visibleGeometry.opacity.toFixed(4),
        String(o.isVisible),
      ].join('|')
    ),
  ];

  let hash = 0x811c9dc5;
  const str = parts.join(':::');
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return `HASH_F82_REP_${(hash >>> 0).toString(16).padStart(8, '0').toUpperCase()}`;
}

export function computeObservableFrameHash(
  frameId: string,
  observerId: string,
  sourceRepHash: string,
  frameIndex: number,
  objects: readonly ObservationFrameObject[]
): string {
  const parts = [
    frameId,
    observerId,
    sourceRepHash,
    String(frameIndex),
    ...objects.map((o) =>
      [
        o.id,
        o.position.join(','),
        o.geometryRepresentation,
        JSON.stringify(o.visibleProperties),
        o.apparentScale.toFixed(4),
      ].join('|')
    ),
  ];

  let hash = 0x811c9dc5;
  const str = parts.join(':::');
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return `HASH_F82_FRAME_${(hash >>> 0).toString(16).padStart(8, '0').toUpperCase()}`;
}
