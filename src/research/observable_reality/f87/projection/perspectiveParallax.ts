/**
 * 3D Memory Studio — Funnel 87
 * Projection: Perspective Projection & Parallax Transformation
 */

import { F87ObserverState } from '../types';

export function projectPerspectiveParallax(
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

  // Perspective scaling
  const perspectiveFactor = observer.focalLength / Math.max(10, forwardDepth);
  const distance = Math.hypot(cx, cy, vz) || 0.1;
  const apparentScale = observer.zoom * (observer.focalLength / Math.max(1, distance));

  const centerX = width / 2;
  const centerY = height / 2;

  const sx = centerX + cx * perspectiveFactor * (scaleFactor / 25);
  const sy = centerY - cy * perspectiveFactor * (scaleFactor / 25);

  const screenRadius = Math.max(4, Math.min(30, 4 + apparentScale * 1.2));
  const visible = forwardDepth > 0.5 && forwardDepth < 250;

  return {
    projectedPos: [cx * perspectiveFactor, cy * perspectiveFactor, vz],
    screenPos: [Number(sx.toFixed(2)), Number(sy.toFixed(2))],
    screenRadius: Number(screenRadius.toFixed(2)),
    apparentScale: Number(apparentScale.toFixed(4)),
    visible,
  };
}
