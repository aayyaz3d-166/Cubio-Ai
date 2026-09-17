/**
 * 3D Memory Studio — Funnel 86
 * Projection: Perspective Visibility Engine
 */

import { F86ObserverState } from '../types';

export function transformPerspectiveVisibility(
  worldPos: readonly number[],
  observer: F86ObserverState,
  width = 800,
  height = 500,
  scaleFactor = 12
): {
  viewPos: [number, number, number];
  screenPos: [number, number];
  screenRadius: number;
  apparentScale: number;
  depthZ: number;
} {
  const [ox, oy, oz] = observer.position;
  const [yawDeg, pitchDeg] = observer.orientation;

  const [wx = 0, wy = 0, wz = 0] = worldPos;

  // Translation
  const dx = wx - ox;
  const dy = wy - oy;
  const dz = wz - oz;

  // Yaw rotation around Y
  const yaw = (yawDeg * Math.PI) / 180;
  const cosY = Math.cos(yaw);
  const sinY = Math.sin(yaw);

  const rx = dx * cosY + dz * sinY;
  const rz = -dx * sinY + dz * cosY;

  // Pitch rotation around X
  const pitch = (pitchDeg * Math.PI) / 180;
  const cosP = Math.cos(pitch);
  const sinP = Math.sin(pitch);

  const ry = dy * cosP - rz * sinP;
  const vz = dy * sinP + rz * cosP;

  const forwardDepth = Math.max(0.1, -vz);
  const distance = Math.hypot(rx, ry, vz) || 0.1;

  // Perspective scaling
  const perspectiveFactor = observer.focalLength / Math.max(10, forwardDepth);
  const apparentScale = observer.zoom * (observer.focalLength / Math.max(1, distance));

  const centerX = width / 2;
  const centerY = height / 2;

  const sx = centerX + rx * perspectiveFactor * (scaleFactor / 25);
  const sy = centerY - ry * perspectiveFactor * (scaleFactor / 25);
  const screenRadius = Math.max(4, Math.min(26, 8 * apparentScale));

  return {
    viewPos: [Number(rx.toFixed(4)), Number(ry.toFixed(4)), Number(vz.toFixed(4))],
    screenPos: [Number(sx.toFixed(2)), Number(sy.toFixed(2))],
    screenRadius: Number(screenRadius.toFixed(2)),
    apparentScale: Number(apparentScale.toFixed(4)),
    depthZ: forwardDepth,
  };
}
