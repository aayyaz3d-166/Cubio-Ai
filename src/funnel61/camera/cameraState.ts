/**
 * 3D Memory Studio — Funnel 61
 * Camera State Factory & Serialization
 */

import { CameraState } from '../types';
import { DEFAULT_CAMERA_DISTANCE } from '../navigation/navigationBounds';

export function createDefaultCameraState(): CameraState {
  return {
    position: [0, 80, DEFAULT_CAMERA_DISTANCE],
    target: [0, 0, 0],
    up: [0, 1, 0],
    zoom: 1.0,
    distance: DEFAULT_CAMERA_DISTANCE,
    yaw: 0,
    pitch: 17,
    roll: 0,
    fov: 60,
    near: 0.1,
    far: 2500,
    mode: 'ORBIT',
    dimension: 3,
    focusedObjectId: null,
    isTransitioning: false,
    enabled: true,
  };
}

export function cloneCameraState(state: CameraState): CameraState {
  return {
    position: [...state.position],
    target: [...state.target],
    up: [...state.up],
    zoom: state.zoom,
    distance: state.distance,
    yaw: state.yaw,
    pitch: state.pitch,
    roll: state.roll,
    fov: state.fov,
    near: state.near,
    far: state.far,
    mode: state.mode,
    dimension: state.dimension,
    focusedObjectId: state.focusedObjectId,
    isTransitioning: state.isTransitioning,
    enabled: state.enabled,
  };
}
