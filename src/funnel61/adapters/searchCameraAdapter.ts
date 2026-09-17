/**
 * 3D Memory Studio — Funnel 61
 * Search Camera Adapter
 */

import { CameraState } from '../types';
import { CameraFocusManager } from '../focus/cameraFocusManager';
import { isPermittedCameraTarget } from './securityCameraAdapter';
import { DataClassification } from '../../funnel47/types';

export function focusSearchResultState(
  state: CameraState,
  stateId: string,
  position: readonly [number, number, number],
  classification: DataClassification,
  focusManager: CameraFocusManager
): boolean {
  if (!isPermittedCameraTarget(classification)) return false;

  focusManager.focusState(state, stateId, position, 15);
  return true;
}
