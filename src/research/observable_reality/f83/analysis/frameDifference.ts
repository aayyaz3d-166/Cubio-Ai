/**
 * 3D Memory Studio — Funnel 83
 * Frame Difference Analysis Engine
 */

import { FrameDifferenceReport, ObserverFrameConfig } from '../types';
import { ObservationFrame, FullState, Coordinate3D } from '../../f82/types';

export function analyzeFrameDifference(
  frameA: ObservationFrame,
  frameB: ObservationFrame,
  configA: ObserverFrameConfig,
  configB: ObserverFrameConfig
): FrameDifferenceReport {
  const dx = configB.position[0] - configA.position[0];
  const dy = configB.position[1] - configA.position[1];
  const dz = configB.position[2] - configA.position[2];
  const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

  const mapA = new Map(frameA.visibleObjects.map((o) => [o.id, o]));
  const mapB = new Map(frameB.visibleObjects.map((o) => [o.id, o]));

  const changedIds: string[] = [];
  const unchangedIds: string[] = [];

  for (const [id, objB] of mapB) {
    const objA = mapA.get(id);
    if (!objA) {
      changedIds.push(id);
    } else {
      const posDist = Math.sqrt(
        Math.pow(objB.position[0] - objA.position[0], 2) +
        Math.pow(objB.position[1] - objA.position[1], 2) +
        Math.pow(objB.position[2] - objA.position[2], 2)
      );

      if (posDist > 0.0001 || objA.apparentScale !== objB.apparentScale) {
        changedIds.push(id);
      } else {
        unchangedIds.push(id);
      }
    }
  }

  for (const id of mapA.keys()) {
    if (!mapB.has(id) && !changedIds.includes(id)) {
      changedIds.push(id);
    }
  }

  const matches = frameA.frameHash === frameB.frameHash && changedIds.length === 0;

  return Object.freeze({
    frameAId: frameA.frameId,
    frameBId: frameB.frameId,
    observerAId: configA.observerId,
    observerBId: configB.observerId,
    positionDelta: Object.freeze([
      Number(dx.toFixed(4)),
      Number(dy.toFixed(4)),
      Number(dz.toFixed(4)),
    ]) as unknown as Coordinate3D,
    positionDeltaMagnitude: Number(dist.toFixed(4)),
    representationMatches: matches,
    visibleObjectCountA: frameA.visibleObjects.length,
    visibleObjectCountB: frameB.visibleObjects.length,
    changedObjectIds: Object.freeze(changedIds),
    unchangedObjectIds: Object.freeze(unchangedIds),
  });
}
