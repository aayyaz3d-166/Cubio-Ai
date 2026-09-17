/**
 * 3D Memory Studio — Funnel 52
 * Bounded Relational Graph Layout Engine
 */

import { SimulatedStateNode, SimulatedEdge } from '../types';

export function buildSimulatedEdges(
  nodes: readonly SimulatedStateNode[],
  maxEdges = 100
): readonly SimulatedEdge[] {
  if (nodes.length < 2) return Object.freeze([]);

  const edges: SimulatedEdge[] = [];
  const edgeSet = new Set<string>();

  // 1. Cluster intra-connectivity (nodes in the same cluster connect to neighbors)
  const byCluster = new Map<string, SimulatedStateNode[]>();
  for (const n of nodes) {
    if (!byCluster.has(n.clusterId)) byCluster.set(n.clusterId, []);
    byCluster.get(n.clusterId)!.push(n);
  }

  for (const clusterNodes of byCluster.values()) {
    for (let i = 0; i < clusterNodes.length - 1; i++) {
      if (edges.length >= maxEdges) break;
      const src = clusterNodes[i];
      const tgt = clusterNodes[i + 1];
      const key = `${src.stateId}->${tgt.stateId}`;
      if (!edgeSet.has(key)) {
        edgeSet.add(key);
        edges.push(
          Object.freeze({
            id: `EDGE_CLUSTER_${key}`,
            sourceNodeId: src.stateId,
            targetNodeId: tgt.stateId,
            relationshipType: 'CLUSTER_SEMANTIC',
            opacity: 0.35,
            colorHex: src.colorHex,
          })
        );
      }
    }
  }

  // 2. Cross-cluster sequential linkage
  for (let i = 0; i < nodes.length - 1; i++) {
    if (edges.length >= maxEdges) break;
    const src = nodes[i];
    const tgt = nodes[i + 1];
    const key = `${src.stateId}->${tgt.stateId}`;
    if (!edgeSet.has(key) && src.clusterId !== tgt.clusterId) {
      edgeSet.add(key);
      edges.push(
        Object.freeze({
          id: `EDGE_CROSS_${key}`,
          sourceNodeId: src.stateId,
          targetNodeId: tgt.stateId,
          relationshipType: 'CROSS_DISCIPLINARY',
          opacity: 0.2,
          colorHex: '#06b6d4',
        })
      );
    }
  }

  return Object.freeze(edges);
}
