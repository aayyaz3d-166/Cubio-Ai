/**
 * 3D Memory Studio — Funnel 59
 * Graph-Aware Cluster Metrics & Query Engine
 */

import { Cluster, ClusterMetrics } from '../types';
import { GraphRegistry } from '../../funnel58/graph/graphRegistry';
import { GraphRelationship } from '../../funnel58/types';

export function calculateClusterMetrics(
  cluster: Cluster,
  graphRegistry: GraphRegistry
): { internalRels: GraphRelationship[]; externalRels: GraphRelationship[]; metrics: ClusterMetrics } {
  const memberSet = new Set(cluster.memberStateIds);
  const internalRels: GraphRelationship[] = [];
  const externalRels: GraphRelationship[] = [];

  const internalRelIds: string[] = [];

  for (const rel of graphRegistry.getAll()) {
    const srcIn = memberSet.has(rel.sourceStateId);
    const tgtIn = memberSet.has(rel.targetStateId);

    if (srcIn && tgtIn) {
      internalRels.push(rel);
      internalRelIds.push(rel.relationshipId);
    } else if (srcIn || tgtIn) {
      externalRels.push(rel);
    }
  }

  const n = cluster.memberStateIds.length;
  const maxPossibleEdges = n > 1 ? (n * (n - 1)) / 2 : 1;
  const density = Number((internalRels.length / maxPossibleEdges).toFixed(3));

  const metrics: ClusterMetrics = {
    internalEdgeCount: internalRels.length,
    externalEdgeCount: externalRels.length,
    density: Math.min(1.0, density),
    totalDegree: internalRels.length * 2 + externalRels.length,
  };

  cluster.memberRelationshipIds = internalRelIds;
  cluster.metrics = metrics;

  return { internalRels, externalRels, metrics };
}
