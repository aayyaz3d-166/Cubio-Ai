/**
 * 3D Memory Studio — Funnel 61
 * Graph Camera Adapter
 */

import { GraphRegistry } from '../../funnel58/graph/graphRegistry';
import { CameraState } from '../types';
import { CameraFocusManager } from '../focus/cameraFocusManager';
import { isPermittedCameraTarget } from './securityCameraAdapter';

export function focusGraphRelationship(
  state: CameraState,
  relationshipId: string,
  graphRegistry: GraphRegistry,
  focusManager: CameraFocusManager
): boolean {
  const rel = graphRegistry.getRelationship(relationshipId);
  if (!rel) return false;

  if (!isPermittedCameraTarget(rel.classification)) return false;

  focusManager.focusRelationship(state, relationshipId, rel.sourcePos, rel.targetPos);
  return true;
}
