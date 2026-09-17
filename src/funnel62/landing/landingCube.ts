/**
 * 3D Memory Studio — Funnel 62
 * Landing Interactive 3D Cube State & Math
 */

import { LandingCubeState } from '../types';

export function createInitialLandingCubeState(): LandingCubeState {
  return {
    rotationX: 25,
    rotationY: 45,
    rotationZ: 0,
    scale: 1.0,
    isDragging: false,
    autoRotate: true,
  };
}

export function rotateLandingCube(
  state: LandingCubeState,
  deltaX: number,
  deltaY: number
): void {
  state.rotationY = (state.rotationY + deltaX * 0.5) % 360;
  state.rotationX = Math.max(-85, Math.min(85, state.rotationX + deltaY * 0.5));
}

export function updateLandingCubeAutoRotate(
  state: LandingCubeState,
  deltaSeconds: number
): void {
  if (state.autoRotate && !state.isDragging) {
    state.rotationY = (state.rotationY + deltaSeconds * 20) % 360;
  }
}
