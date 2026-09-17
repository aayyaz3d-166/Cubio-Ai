/**
 * 3D Memory Studio — Funnel 54
 * Advanced Camera Controller with Focus, Auto-Framing, and Deterministic Easing
 */

import { SimulationCamera, SimulationDimension } from '../../funnel52/types';
import { StudioNodeViewModel, StudioClusterViewModel } from '../../funnel53/types';
import { createDefaultStudioCamera } from '../../funnel53/visual/cameraController';

export function calculateNodeFocusCamera(
  node: StudioNodeViewModel,
  currentCamera: SimulationCamera
): SimulationCamera {
  // Center yaw and pitch towards the node
  const radToDeg = 180 / Math.PI;
  const targetYaw = Math.atan2(-node.x, node.z) * radToDeg;
  const targetPitch = Math.asin(Math.max(-1, Math.min(1, -node.y / 400))) * radToDeg;

  return Object.freeze({
    rotX: Math.max(-60, Math.min(60, targetPitch)),
    rotY: targetYaw % 360,
    zoom: Math.max(1.2, Math.min(2.2, currentCamera.zoom * 1.3)),
    panX: 0,
    panY: 0,
  });
}

export function calculateClusterFocusCamera(
  cluster: StudioClusterViewModel,
  currentCamera: SimulationCamera
): SimulationCamera {
  const radToDeg = 180 / Math.PI;
  const targetYaw = Math.atan2(-cluster.centerX, cluster.centerZ) * radToDeg;

  return Object.freeze({
    rotX: 20,
    rotY: targetYaw % 360,
    zoom: 1.3,
    panX: 0,
    panY: 0,
  });
}

export function calculateAutoFrameCamera(dimension: SimulationDimension): SimulationCamera {
  switch (dimension) {
    case 1:
      return Object.freeze({ rotX: 0, rotY: 0, zoom: 0.9, panX: 0, panY: 0 });
    case 2:
      return Object.freeze({ rotX: 30, rotY: 0, zoom: 1.0, panX: 0, panY: 0 });
    case 8:
    case 12:
    case 16:
      return Object.freeze({ rotX: 25, rotY: 45, zoom: 0.85, panX: 0, panY: 0 });
    case 3:
    case 4:
    default:
      return createDefaultStudioCamera();
  }
}
