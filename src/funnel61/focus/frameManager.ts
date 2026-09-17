/**
 * 3D Memory Studio — Funnel 61
 * Frame Object Distance Calculator
 */

import { clampDistance } from '../camera/cameraSafetyController';

export function calculateFrameDistance(
  radius: number,
  fov = 60,
  padding = 20
): number {
  const safeRadius = Math.max(5, radius);
  const fovRad = (fov * Math.PI) / 180;
  const sinHalfFov = Math.sin(fovRad / 2);

  const rawDist = (safeRadius + padding) / (sinHalfFov > 0.01 ? sinHalfFov : 0.5);
  return clampDistance(Number(rawDist.toFixed(3)));
}
