/**
 * 3D Memory Studio — Funnel 50
 * Simulation Camera Controls & Navigation
 *
 * Provides deterministic orbit, pan, zoom, and node focus calculations
 * for the 3D viewport.
 */

import { SimulationCameraState, SimulationNode, Spatial3DVector } from './types';

/**
 * Creates default initial camera state centered on universe origin
 */
export function createInitialCameraState(): SimulationCameraState {
  return Object.freeze({
    position: Object.freeze({ x: 0, y: 0, z: 600 }),
    target: Object.freeze({ x: 0, y: 0, z: 0 }),
    zoom: 1.0,
    pitch: 0.2,
    yaw: 0.3,
    isTransitioning: false,
  });
}

/**
 * Focuses camera smoothly onto a target simulation node
 */
export function focusCameraOnNode(
  currentCamera: SimulationCameraState,
  node: SimulationNode
): SimulationCameraState {
  return Object.freeze({
    ...currentCamera,
    target: Object.freeze({ ...node.position3D }),
    zoom: 1.8,
    isTransitioning: true,
  });
}

/**
 * Updates camera orbit pitch and yaw
 */
export function orbitCamera(
  currentCamera: SimulationCameraState,
  deltaPitch: number,
  deltaYaw: number
): SimulationCameraState {
  const newPitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, currentCamera.pitch + deltaPitch));
  const newYaw = currentCamera.yaw + deltaYaw;

  return Object.freeze({
    ...currentCamera,
    pitch: newPitch,
    yaw: newYaw,
    isTransitioning: false,
  });
}

/**
 * Updates camera pan along screen plane
 */
export function panCamera(
  currentCamera: SimulationCameraState,
  deltaX: number,
  deltaY: number
): SimulationCameraState {
  return Object.freeze({
    ...currentCamera,
    position: Object.freeze({
      x: currentCamera.position.x - deltaX,
      y: currentCamera.position.y + deltaY,
      z: currentCamera.position.z,
    }),
    target: Object.freeze({
      x: currentCamera.target.x - deltaX,
      y: currentCamera.target.y + deltaY,
      z: currentCamera.target.z,
    }),
    isTransitioning: false,
  });
}

/**
 * Adjusts camera zoom factor bounded between 0.3x and 4.0x
 */
export function zoomCamera(
  currentCamera: SimulationCameraState,
  deltaZoom: number
): SimulationCameraState {
  const newZoom = Math.max(0.3, Math.min(4.0, currentCamera.zoom + deltaZoom));
  return Object.freeze({
    ...currentCamera,
    zoom: newZoom,
    isTransitioning: false,
  });
}
