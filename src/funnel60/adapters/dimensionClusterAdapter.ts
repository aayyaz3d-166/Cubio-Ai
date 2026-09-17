/**
 * 3D Memory Studio — Funnel 60
 * Cluster Engine ↔ Dimension Synchronizer Adapter
 */

import { ClusterRegistry } from '../../funnel59/cluster/clusterRegistry';
import { DimensionCoordinate } from '../types';
import {
  calculateClusterCenter,
  calculateClusterBounds,
  calculateClusterRadius,
} from '../../funnel59/cluster/clusterModel';

export function applyProjectionsToClusters(
  projections: readonly DimensionCoordinate[],
  clusterRegistry: ClusterRegistry
): void {
  const coordMap = new Map<string, [number, number, number]>();
  for (const c of projections) {
    coordMap.set(c.stateId, [...c.projectedPosition]);
  }

  for (const cluster of clusterRegistry.getAll()) {
    const memberPositions: [number, number, number][] = [];

    for (const stateId of cluster.memberStateIds) {
      const pos = coordMap.get(stateId);
      if (pos) {
        memberPositions.push([...pos]);
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
      cluster.dimension = projections[0]?.dimension ?? cluster.dimension;
    }
  }
}
