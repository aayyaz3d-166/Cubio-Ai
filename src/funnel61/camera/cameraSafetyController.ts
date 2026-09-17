/**
 * 3D Memory Studio — Funnel 61
 * Camera Safety Controller
 *
 * Prevents zero-distance, NaN, Infinity, camera flipping, and out-of-bounds positioning.
 */

import {
  MIN_CAMERA_DISTANCE,
  MAX_CAMERA_DISTANCE,
  MIN_PITCH,
  MAX_PITCH,
  TARGET_MIN,
  TARGET_MAX,
  CAMERA_POS_MIN,
  CAMERA_POS_MAX,
} from '../navigation/navigationBounds';

export function isFiniteNumber(val: unknown): boolean {
  if (typeof val !== 'number') return false;
  return !isNaN(val) && isFinite(val);
}

export function clampDistance(dist: number): number {
  if (!isFiniteNumber(dist)) return 250;
  return Math.max(MIN_CAMERA_DISTANCE, Math.min(MAX_CAMERA_DISTANCE, dist));
}

export function clampPitch(pitch: number): number {
  if (!isFiniteNumber(pitch)) return 15;
  return Math.max(MIN_PITCH, Math.min(MAX_PITCH, pitch));
}

export function clampTargetCoordinate(val: number): number {
  if (!isFiniteNumber(val)) return 0;
  return Math.max(TARGET_MIN, Math.min(TARGET_MAX, val));
}

export function clampCameraPosition(pos: [number, number, number]): [number, number, number] {
  const sanitize = (v: number, def: number): number => {
    if (typeof v !== 'number' || isNaN(v)) return def;
    if (v === Infinity) return CAMERA_POS_MAX;
    if (v === -Infinity) return CAMERA_POS_MIN;
    return Math.max(CAMERA_POS_MIN, Math.min(CAMERA_POS_MAX, v));
  };

  return [
    sanitize(pos[0], 0),
    sanitize(pos[1], 80),
    sanitize(pos[2], 250),
  ];
}
