/**
 * 3D Memory Studio — Funnel 85
 * Projection: World Space → View Space Transform (W → V)
 */

import { F85ObserverState } from '../types';

export function transformWorldToView(
  worldPos: readonly number[],
  observer: F85ObserverState
): {
  viewPos: [number, number, number];
  distance: number;
  apparentScale: number;
} {
  const [ox, oy, oz] = observer.position;
  const [yawDeg, pitchDeg] = observer.orientation;

  const [wx = 0, wy = 0, wz = 0] = worldPos;

  // 1. Translation relative to camera
  const dx = wx - ox;
  const dy = wy - oy;
  const dz = wz - oz;

  // 2. Rotation: Yaw around Y axis
  const yaw = (yawDeg * Math.PI) / 180;
  const cosY = Math.cos(yaw);
  const sinY = Math.sin(yaw);

  const rx = dx * cosY + dz * sinY;
  const rz = -dx * sinY + dz * cosY;

  // 3. Rotation: Pitch around X axis
  const pitch = (pitchDeg * Math.PI) / 180;
  const cosP = Math.cos(pitch);
  const sinP = Math.sin(pitch);

  const ry = dy * cosP - rz * sinP;
  const vz = dy * sinP + rz * cosP;

  const distance = Math.hypot(rx, ry, vz) || 0.1;
  const apparentScale = observer.zoom * (observer.focalLength / Math.max(1, distance));

  return {
    viewPos: [Number(rx.toFixed(4)), Number(ry.toFixed(4)), Number(vz.toFixed(4))],
    distance: Number(distance.toFixed(4)),
    apparentScale: Number(apparentScale.toFixed(4)),
  };
}
