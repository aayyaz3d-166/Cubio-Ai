/**
 * 3D Memory Studio — Funnel 61
 * Graph Neighborhood Focus Calculator
 */

import { GraphRegistry } from '../../funnel58/graph/graphRegistry';
import { getSubgraph } from '../../funnel58/graph/graphQueries';
import { calculateClusterCenter, calculateClusterRadius } from '../../funnel59/cluster/clusterModel';
import { calculateFrameDistance } from './frameManager';

export function calculateNeighborhoodFraming(
  rootStateId: string,
  depth: number,
  graphRegistry: GraphRegistry,
  nodePositions: Map<string, [number, number, number]>,
  fov = 60
): { center: [number, number, number]; distance: number; radius: number; nodeCount: number } | null {
  const boundedDepth = Math.max(1, Math.min(3, depth));
  const subgraph = getSubgraph(rootStateId, boundedDepth, graphRegistry);

  const positions: [number, number, number][] = [];
  for (const nodeId of subgraph.nodeIds) {
    const pos = nodePositions.get(nodeId);
    if (pos) {
      positions.push([...pos]);
    }
  }

  if (positions.length === 0) return null;

  const center = calculateClusterCenter(positions);
  const radius = calculateClusterRadius(positions, center, 20);
  const distance = calculateFrameDistance(radius, fov, 25);

  return {
    center,
    distance,
    radius,
    nodeCount: positions.length,
  };
}
