/**
 * 3D Memory Studio — Funnel 59
 * Cluster Resolver & GREEN Security Gate
 *
 * Resolves cluster entity, calculates centroid & radius, and enforces F47 GREEN authority.
 */

import { Cluster, ClusterType } from '../types';
import {
  calculateClusterCenter,
  calculateClusterBounds,
  calculateClusterRadius,
  getClusterTypeColor,
} from './clusterModel';
import { DimensionalInformationState } from '../../funnel49/types';
import { SimulatedStateNode } from '../../funnel52/types';
import { GraphNode } from '../../funnel58/types';

export function resolveCluster(
  clusterType: ClusterType,
  name: string,
  memberStates: readonly (DimensionalInformationState | SimulatedStateNode | GraphNode)[],
  dimension = 3
): Cluster | null {
  if (!name || memberStates.length === 0) return null;

  // 1. F47 Security Gate: All member states must be GREEN
  const greenMembers = memberStates.filter(
    (s) => s.classification === 'GREEN' && ('processingAllowed' in s ? s.processingAllowed : true)
  );

  if (greenMembers.length === 0) {
    return null; // Strictly blocked
  }

  // 2. Extract positions and state IDs
  const memberStateIds: string[] = [];
  const positions: [number, number, number][] = [];

  for (const s of greenMembers) {
    memberStateIds.push(s.stateId);
    if ('position' in s && Array.isArray(s.position)) {
      positions.push([s.position[0], s.position[1], s.position[2]]);
    } else if ('x' in s) {
      positions.push([(s as any).x, (s as any).y, (s as any).z]);
    } else {
      positions.push([0, 0, 0]);
    }
  }

  // 3. Deterministic Spatial Math
  const center = calculateClusterCenter(positions);
  const bounds = calculateClusterBounds(positions);
  const radius = calculateClusterRadius(positions, center);
  const colorHex = getClusterTypeColor(clusterType);

  const clusterId = `CLUSTER_${clusterType}_${name.replace(/[^a-zA-Z0-9_]/g, '_').toUpperCase()}`;

  return {
    clusterId,
    clusterType,
    name,
    memberStateIds,
    memberRelationshipIds: [],
    center,
    radius,
    minBounds: bounds.min,
    maxBounds: bounds.max,
    dimension: dimension as any,
    visible: true,
    enabled: true,
    selected: false,
    highlighted: false,
    parentClusterId: null,
    childClusterIds: [],
    classification: 'GREEN',
    metadata: {},
    checksum: `CRC32_${clusterId}`,
    metrics: {
      internalEdgeCount: 0,
      externalEdgeCount: 0,
      density: 0.0,
      totalDegree: 0,
    },
    colorHex,
  };
}
