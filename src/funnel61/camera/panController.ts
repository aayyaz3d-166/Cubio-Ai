/**
 * 3D Memory Studio — Funnel 61
 * Pan Controller
 */

import { CameraState } from '../types';
import { clampTargetCoordinate, clampCameraPosition } from './cameraSafetyController';
import { recalculateOrbitPosition } from './orbitController';

export function panWorld(state: CameraState, delta: readonly [number, number, number]): void {
  const [dx, dy, dz] = delta;

  state.target = [
    clampTargetCoordinate(state.target[0] + dx),
    clampTargetCoordinate(state.target[1] + dy),
    clampTargetCoordinate(state.target[2] + dz),
  ];

  state.position = clampCameraPosition([
    state.position[0] + dx,
    state.position[1] + dy,
    state.position[2] + dz,
  ]);
}

export function panScreen(state: CameraState, deltaX: number, deltaY: number): void {
  const yawRad = (state.yaw * Math.PI) / 180;
  // Right vector in XZ plane
  const rx = Math.cos(yawRad);
  const rz = -Math.sin(yawRad);

  const dx = rx * deltaX;
  const dy = deltaY;
  const dz = rz * deltaX;

  panWorld(state, [dx, dy, dz]);
}

export function panTo(state: CameraState, newTarget: readonly [number, number, number]): void {
  state.target = [
    clampTargetCoordinate(newTarget[0]),
    clampTargetCoordinate(newTarget[1]),
    clampTargetCoordinate(newTarget[2]),
  ];
  recalculateOrbitPosition(state);
}
