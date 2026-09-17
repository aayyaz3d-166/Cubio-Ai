/**
 * 3D Memory Studio — Funnel 61
 * Scene Camera Adapter
 */

import { SceneEngine } from '../../funnel56/scene/sceneEngine';
import { CameraState } from '../types';
import { CameraFocusManager } from '../focus/cameraFocusManager';
import { isPermittedCameraTarget } from './securityCameraAdapter';

export function focusSceneObject(
  state: CameraState,
  objectId: string,
  sceneEngine: SceneEngine,
  focusManager: CameraFocusManager
): boolean {
  const obj = sceneEngine.registry.get(objectId);
  if (!obj) return false;

  // F47 security check
  if (!isPermittedCameraTarget(obj.classification)) return false;

  focusManager.focusState(state, objectId, obj.transform.position as [number, number, number], 15);
  return true;
}
