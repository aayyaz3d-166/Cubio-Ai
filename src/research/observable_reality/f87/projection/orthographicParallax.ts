/**
 * 3D Memory Studio — Funnel 87
 * Projection: Orthographic Projection Engine
 */

import { F87ObserverState } from '../types';

export function projectOrthographicParallax(
  cameraSpacePos: readonly [number, number, number],
  observer: F87ObserverState,
  width = 800,
  height = 500,
  scaleFactor = 12
): {
  projectedPos: [number, number, number];
  screenPos: [number, number];
  screenRadius: number;
  apparentScale: number;
  visible: boolean;
} {
  const [cx, cy, vz] = cameraSpacePos;
  const forwardDepth = Math.max(0.1, -vz);

  const centerX = width / 2;
  const centerY = height / 2;

  // Orthographic: screen position independent of depth
  const sx = centerX + cx * scaleFactor;
  const sy = centerY - cy * scaleFactor;
  const screenRadius = Math.max(4, Math.min(20, 8 * observer.zoom));

  return {
    projectedPos: [cx, cy, vz],
    screenPos: [Number(sx.toFixed(2)), Number(sy.toFixed(2))],
    screenRadius: Number(screenRadius.toFixed(2)),
    apparentScale: observer.zoom,
    visible: forwardDepth > 0,
  };
}
