/**
 * 3D Memory Studio — Funnel 59
 * Scene Graph ↔ Cluster Synchronizer Adapter
 */

import { SceneEngine } from '../../funnel56/scene/sceneEngine';
import { ClusterRegistry } from '../cluster/clusterRegistry';
import { ClusterMeshWrapper } from '../geometry/clusterGeometry';
import {
  calculateClusterCenter,
  calculateClusterBounds,
  calculateClusterRadius,
} from '../cluster/clusterModel';

export function syncSceneToClusters(
  sceneEngine: SceneEngine,
  clusterRegistry: ClusterRegistry,
  clusterMeshes: Map<string, ClusterMeshWrapper>
): void {
  for (const cluster of clusterRegistry.getAll()) {
    const memberPositions: [number, number, number][] = [];

    for (const stateId of cluster.memberStateIds) {
      const sceneObj = sceneEngine.registry.get(stateId);
      if (sceneObj) {
        const [wx, wy, wz] = sceneObj.worldTransform.position;
        memberPositions.push([wx, wy, wz]);
      }
    }

    if (memberPositions.length > 0) {
      const center = calculateClusterCenter(memberPositions);
      const bounds = calculateClusterBounds(memberPositions);
      const radius = calculateClusterRadius(memberPositions, center);

      cluster.center = center;
      cluster.minBounds = bounds.min;
      cluster.maxBounds = bounds.max;
      cluster.radius = radius;

      const mesh = clusterMeshes.get(cluster.clusterId);
      if (mesh) {
        mesh.updateGeometry(center, radius);
      }
    }
  }
}
