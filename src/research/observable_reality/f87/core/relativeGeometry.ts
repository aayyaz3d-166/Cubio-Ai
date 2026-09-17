/**
 * 3D Memory Studio — Funnel 87
 * Core: Observer Relative Geometry & Transform
 */

import { F87ObserverState } from '../types';

export function calculateRelativeGeometry(
  worldPos: readonly number[],
  observer: F87ObserverState
): {
  relativeVector: [number, number, number];
  cameraSpacePos: [number, number, number];
  depthZ: number;
  distance: number;
} {
  const [ox, oy, oz] = observer.position;
  const [yawDeg, pitchDeg] = observer.orientation;

  const [wx = 0, wy = 0, wz = 0] = worldPos;

  // Vector from observer to target in world coordinates
  const rxRel = wx - ox;
  const ryRel = wy - oy;
  const rzRel = wz - oz;

  // Yaw rotation around Y axis
  const yaw = (yawDeg * Math.PI) / 180;
  const cosY = Math.cos(yaw);
  const sinY = Math.sin(yaw);

  const cx = rxRel * cosY + rzRel * sinY;
  const cz = -rxRel * sinY + rzRel * cosY;

  // Pitch rotation around X axis
  const pitch = (pitchDeg * Math.PI) / 180;
  const cosP = Math.cos(pitch);
  const sinP = Math.sin(pitch);

  const cy = ryRel * cosP - cz * sinP;
  const vz = ryRel * sinP + cz * cosP;

  const forwardDepth = Math.max(0.1, -vz);
  const distance = Math.hypot(rxRel, ryRel, rzRel) || 0.1;

  return {
    relativeVector: [Number(rxRel.toFixed(4)), Number(ryRel.toFixed(4)), Number(rzRel.toFixed(4))],
    cameraSpacePos: [Number(cx.toFixed(4)), Number(cy.toFixed(4)), Number(vz.toFixed(4))],
    depthZ: Number(forwardDepth.toFixed(4)),
    distance: Number(distance.toFixed(4)),
  };
}
