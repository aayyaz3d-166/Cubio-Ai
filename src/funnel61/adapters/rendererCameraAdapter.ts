/**
 * 3D Memory Studio — Funnel 61
 * Renderer Camera Adapter
 *
 * Synchronizes F61 CameraState into F55 Three.js PerspectiveCamera.
 */

import * as THREE from 'three';
import { CameraState } from '../types';
import { RendererPerspectiveCamera } from '../../funnel55/camera/cameraController';

export function applyCameraStateToThreeCamera(
  state: CameraState,
  threeCamera: RendererPerspectiveCamera | THREE.PerspectiveCamera
): void {
  if ('isPerspectiveCamera' in threeCamera) {
    threeCamera.position.set(state.position[0], state.position[1], state.position[2]);
    threeCamera.up.set(state.up[0], state.up[1], state.up[2]);
    threeCamera.lookAt(state.target[0], state.target[1], state.target[2]);

    if (threeCamera.fov !== state.fov) {
      threeCamera.fov = state.fov;
      threeCamera.updateProjectionMatrix();
    }
  } else {
    threeCamera.position = [...state.position];
    threeCamera.target = [...state.target];
    threeCamera.fov = state.fov;
    threeCamera.lookAt(state.target[0], state.target[1], state.target[2]);
  }
}
