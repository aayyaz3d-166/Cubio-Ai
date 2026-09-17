/**
 * 3D Memory Studio — Funnel 58
 * Graph Priority & Budget Bounding Engine
 *
 * Deterministically bounds visible edges to <= 100 and visible nodes to <= 50.
 */

import { GraphRelationship, GraphNode } from '../types';

export const MAX_VISIBLE_EDGES = 100;
export const MAX_VISIBLE_NODES = 50;

export function prioritizeAndBoundEdges(
  relationships: readonly GraphRelationship[],
  selectedNodeId: string | null = null,
  maxEdges = MAX_VISIBLE_EDGES
): GraphRelationship[] {
  // Sort deterministically
  const sorted = [...relationships].sort((a, b) => {
    // 1. Selected node connected edges first
    if (selectedNodeId) {
      const aSelected = a.sourceStateId === selectedNodeId || a.targetStateId === selectedNodeId;
      const bSelected = b.sourceStateId === selectedNodeId || b.targetStateId === selectedNodeId;
      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;
    }

    // 2. Highlighted edges second
    if (a.highlighted && !b.highlighted) return -1;
    if (!a.highlighted && b.highlighted) return 1;

    // 3. Highest strength third
    if (b.strength !== a.strength) {
      return b.strength - a.strength;
    }

    // 4. Deterministic string tie-breaker
    return a.relationshipId.localeCompare(b.relationshipId);
  });

  // Apply budget
  for (let i = 0; i < sorted.length; i++) {
    sorted[i].visible = i < maxEdges;
  }

  return sorted.slice(0, maxEdges);
}

export function boundVisibleNodes(
  nodes: readonly GraphNode[],
  maxNodes = MAX_VISIBLE_NODES
): GraphNode[] {
  const sorted = [...nodes].sort((a, b) => {
    if (a.selected && !b.selected) return -1;
    if (!a.selected && b.selected) return 1;
    if (a.highlighted && !b.highlighted) return -1;
    if (!a.highlighted && b.highlighted) return 1;
    if (b.degree !== a.degree) return b.degree - a.degree;
    return a.stateId.localeCompare(b.stateId);
  });

  for (let i = 0; i < sorted.length; i++) {
    sorted[i].visible = i < maxNodes;
  }

  return sorted.slice(0, maxNodes);
}
