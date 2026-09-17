/**
 * 3D Memory Studio — Funnel 63
 * Cube Interaction & Deterministic Math Controller
 */

import { CubeState } from '../types';
import {
  MIN_CUBE_SCALE,
  MAX_CUBE_SCALE,
  MIN_CUBE_PITCH,
  MAX_CUBE_PITCH,
  createInitialCubeState,
} from './cubeState';

export class CubeInteractionController {
  public applyDragRotation(state: CubeState, deltaX: number, deltaY: number): void {
    // Yaw rotation around Y axis
    let nextYaw = (state.rotationY + deltaX * 0.5) % 360;
    if (nextYaw < 0) nextYaw += 360;
    state.rotationY = nextYaw;

    // Pitch rotation around X axis strictly clamped [-85, 85]
    const nextPitch = state.rotationX + deltaY * 0.5;
    state.rotationX = Math.max(MIN_CUBE_PITCH, Math.min(MAX_CUBE_PITCH, nextPitch));
  }

  public applyZoom(state: CubeState, deltaScale: number): void {
    const nextScale = state.scale + deltaScale;
    state.scale = Math.max(MIN_CUBE_SCALE, Math.min(MAX_CUBE_SCALE, nextScale));
  }

  public updateAutoRotation(state: CubeState, deltaSeconds: number, speedDegreesPerSec = 20): void {
    if (state.autoRotate && !state.isDragging) {
      let nextYaw = (state.rotationY + deltaSeconds * speedDegreesPerSec) % 360;
      if (nextYaw < 0) nextYaw += 360;
      state.rotationY = nextYaw;
    }
  }

  public reset(state: CubeState): void {
    const init = createInitialCubeState();
    state.rotationX = init.rotationX;
    state.rotationY = init.rotationY;
    state.rotationZ = init.rotationZ;
    state.scale = init.scale;
    state.autoRotate = init.autoRotate;
    state.isDragging = false;
    state.activeFace = null;
    state.hoveredFace = null;
  }
}
