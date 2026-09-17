/**
 * 3D Memory Studio — Funnel 61
 * Zoom Controller
 */

import { CameraState } from '../types';
import { clampDistance } from './cameraSafetyController';
import { recalculateOrbitPosition } from './orbitController';

export function zoomCamera(state: CameraState, deltaDistance: number): void {
  state.distance = clampDistance(state.distance + deltaDistance);
  recalculateOrbitPosition(state);
}

export function setCameraDistance(state: CameraState, distance: number): void {
  state.distance = clampDistance(distance);
  recalculateOrbitPosition(state);
}

export function setCameraFOV(state: CameraState, fov: number): void {
  state.fov = Math.max(20, Math.min(100, fov));
}
