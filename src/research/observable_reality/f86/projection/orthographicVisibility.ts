/**
 * 3D Memory Studio — Funnel 86
 * Projection: Orthographic Visibility Engine
 */

import { F86ObserverState } from '../types';

export function transformOrthographicVisibility(
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

  // Yaw
  const yaw = (yawDeg * Math.PI) / 180;
  const cosY = Math.cos(yaw);
  const sinY = Math.sin(yaw);

  const rx = dx * cosY + dz * sinY;
  const rz = -dx * sinY + dz * cosY;

  // Pitch
  const pitch = (pitchDeg * Math.PI) / 180;
  const cosP = Math.cos(pitch);
  const sinP = Math.sin(pitch);

  const ry = dy * cosP - rz * sinP;
  const vz = dy * sinP + rz * cosP;

  const forwardDepth = Math.max(0.1, -vz);

  const centerX = width / 2;
  const centerY = height / 2;

  // Orthographic: screen position is independent of depth
  const sx = centerX + rx * scaleFactor;
  const sy = centerY - ry * scaleFactor;
  const screenRadius = Math.max(4, Math.min(20, 8 * observer.zoom));

  return {
    viewPos: [Number(rx.toFixed(4)), Number(ry.toFixed(4)), Number(vz.toFixed(4))],
    screenPos: [Number(sx.toFixed(2)), Number(sy.toFixed(2))],
    screenRadius: Number(screenRadius.toFixed(2)),
    apparentScale: observer.zoom,
    depthZ: forwardDepth,
  };
}
