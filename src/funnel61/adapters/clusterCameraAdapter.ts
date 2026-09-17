/**
 * 3D Memory Studio — Funnel 61
 * Cluster Camera Adapter
 */

import { ClusterRegistry } from '../../funnel59/cluster/clusterRegistry';
import { CameraState } from '../types';
import { CameraFocusManager } from '../focus/cameraFocusManager';
import { isPermittedCameraTarget } from './securityCameraAdapter';

export function focusClusterObject(
  state: CameraState,
  clusterId: string,
  clusterRegistry: ClusterRegistry,
  focusManager: CameraFocusManager
): boolean {
  const cluster = clusterRegistry.getCluster(clusterId);
  if (!cluster) return false;

  if (!isPermittedCameraTarget(cluster.classification)) return false;

  focusManager.focusCluster(state, clusterId, cluster.center, cluster.radius);
  return true;
}
