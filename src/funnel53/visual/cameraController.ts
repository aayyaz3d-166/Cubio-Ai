/**
 * 3D Memory Studio — Funnel 53
 * 3D Perspective Camera Controller & Matrix Math
 */

import { SimulationCamera } from '../../funnel52/types';

export interface PerspectiveProjectionResult {
  readonly screenX: number;
  readonly screenY: number;
  readonly scale: number;
  readonly zDepth: number;
}

/**
 * Projects a 3D coordinate (x, y, z) to 2D screen space using camera pitch, yaw, pan, and zoom
 */
export function project3DCoordinateToScreen(
  x: number,
  y: number,
  z: number,
  camera: SimulationCamera,
  cameraDistance = 850
): PerspectiveProjectionResult {
  const radX = (camera.rotX * Math.PI) / 180;
  const radY = (camera.rotY * Math.PI) / 180;

  // 1. Yaw Rotation (around Y axis)
  const cosY = Math.cos(radY);
  const sinY = Math.sin(radY);
  const x1 = x * cosY + z * sinY;
  const z1 = -x * sinY + z * cosY;

  // 2. Pitch Rotation (around X axis)
  const cosX = Math.cos(radX);
  const sinX = Math.sin(radX);
  const y2 = y * cosX - z1 * sinX;
  const z2 = y * sinX + z1 * cosX;

  // 3. Perspective Projection & Zoom
  const fov = cameraDistance / (cameraDistance + z2);
  const scale = Math.max(0.1, fov * camera.zoom);

  const screenX = x1 * scale + camera.panX;
  const screenY = y2 * scale + camera.panY;

  return Object.freeze({
    screenX,
    screenY,
    scale,
    zDepth: z2,
  });
}

/**
 * Creates default initial camera
 */
export function createDefaultStudioCamera(): SimulationCamera {
  return Object.freeze({
    rotX: 18,
    rotY: 28,
    zoom: 1.0,
    panX: 0,
    panY: 0,
  });
}
