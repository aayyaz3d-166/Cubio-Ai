/**
 * 3D Memory Studio — Funnel 58
 * Graph Query Engine & Bounded Depth-3 Traversal
 */

import { GraphRegistry } from './graphRegistry';
import { SubgraphQueryReport, GraphRelationship } from '../types';

export function getConnectedRelationships(
  nodeId: string,
  registry: GraphRegistry
): readonly GraphRelationship[] {
  const rels = new Map<string, GraphRelationship>();
  for (const r of registry.getBySource(nodeId)) {
    rels.set(r.relationshipId, r);
  }
  for (const r of registry.getByTarget(nodeId)) {
    rels.set(r.relationshipId, r);
  }
  return Array.from(rels.values());
}

export function getRelationshipsBetween(
  nodeA: string,
  nodeB: string,
  registry: GraphRegistry
): readonly GraphRelationship[] {
  const result: GraphRelationship[] = [];
  for (const r of registry.getBySource(nodeA)) {
    if (r.targetStateId === nodeB) result.push(r);
  }
  for (const r of registry.getBySource(nodeB)) {
    if (r.targetStateId === nodeA) result.push(r);
  }
  return result;
}

/**
 * Bounded BFS traversal up to maxDepth = 3.
 * Guarantees traversal never exceeds boundary limits.
 */
export function getSubgraph(
  rootNodeId: string,
  requestedDepth = 1,
  registry: GraphRegistry
): SubgraphQueryReport {
  const effectiveDepth = Math.min(3, Math.max(0, requestedDepth));
  const visitedNodes = new Set<string>();
  const visitedRelIds = new Set<string>();

  let currentLevel = new Set<string>([rootNodeId]);
  visitedNodes.add(rootNodeId);

  for (let d = 0; d < effectiveDepth; d++) {
    const nextLevel = new Set<string>();

    for (const currNode of currentLevel) {
      const connected = getConnectedRelationships(currNode, registry);
      for (const rel of connected) {
        visitedRelIds.add(rel.relationshipId);
        const neighbor = rel.sourceStateId === currNode ? rel.targetStateId : rel.sourceStateId;
        if (!visitedNodes.has(neighbor)) {
          visitedNodes.add(neighbor);
          nextLevel.add(neighbor);
        }
      }
    }

    currentLevel = nextLevel;
  }

  return Object.freeze({
    rootNodeId,
    depth: effectiveDepth,
    nodeIds: Array.from(visitedNodes),
    relationshipIds: Array.from(visitedRelIds),
    totalNodes: visitedNodes.size,
    totalRelationships: visitedRelIds.size,
  });
}
