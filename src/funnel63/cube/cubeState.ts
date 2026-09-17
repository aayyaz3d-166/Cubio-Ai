/**
 * 3D Memory Studio — Funnel 63
 * Landing Cube State Factory & Cloner
 */

import { CubeState } from '../types';

export const MIN_CUBE_SCALE = 0.5;
export const MAX_CUBE_SCALE = 2.0;
export const MIN_CUBE_PITCH = -85;
export const MAX_CUBE_PITCH = 85;

export function createInitialCubeState(): CubeState {
  return {
    rotationX: 20,
    rotationY: 35,
    rotationZ: 0,
    scale: 1.0,
    autoRotate: true,
    isDragging: false,
    activeFace: null,
    hoveredFace: null,
  };
}

export function cloneCubeState(state: CubeState): CubeState {
  return {
    ...state,
  };
}
