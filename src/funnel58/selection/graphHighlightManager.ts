/**
 * 3D Memory Studio — Funnel 58
 * Graph Highlight Manager & Search Synchronization
 */

import { GraphRegistry } from '../graph/graphRegistry';
import { GraphModel } from '../graph/graphModel';
import { getConnectedRelationships } from '../graph/graphQueries';

export class GraphHighlightManager {
  private highlightedNodeIds: Set<string> = new Set();
  private highlightedRelIds: Set<string> = new Set();

  public highlightNeighborhood(
    nodeId: string | null,
    model: GraphModel,
    registry: GraphRegistry
  ): void {
    this.clearHighlights(model, registry);
    if (!nodeId) return;

    this.highlightedNodeIds.add(nodeId);
    const connected = getConnectedRelationships(nodeId, registry);

    for (const rel of connected) {
      this.highlightedRelIds.add(rel.relationshipId);
      rel.highlighted = true;

      const neighbor = rel.sourceStateId === nodeId ? rel.targetStateId : rel.sourceStateId;
      this.highlightedNodeIds.add(neighbor);
    }

    for (const node of model.getAllNodes()) {
      node.highlighted = this.highlightedNodeIds.has(node.stateId);
    }
  }

  public highlightBySearchQuery(
    query: string,
    model: GraphModel,
    registry: GraphRegistry
  ): number {
    this.clearHighlights(model, registry);
    if (!query || query.trim() === '') return 0;

    const lower = query.toLowerCase();
    let matchCount = 0;

    for (const node of model.getAllNodes()) {
      if (
        node.stateId.toLowerCase().includes(lower) ||
        node.entityName.toLowerCase().includes(lower) ||
        node.category.toLowerCase().includes(lower)
      ) {
        this.highlightedNodeIds.add(node.stateId);
        node.highlighted = true;
        matchCount++;

        const connected = getConnectedRelationships(node.stateId, registry);
        for (const rel of connected) {
          this.highlightedRelIds.add(rel.relationshipId);
          rel.highlighted = true;
        }
      }
    }

    return matchCount;
  }

  public clearHighlights(model: GraphModel, registry: GraphRegistry): void {
    this.highlightedNodeIds.clear();
    this.highlightedRelIds.clear();

    for (const node of model.getAllNodes()) {
      node.highlighted = false;
    }
    for (const rel of registry.getAll()) {
      rel.highlighted = false;
    }
  }

  public getHighlightedCount(): { nodes: number; relationships: number } {
    return {
      nodes: this.highlightedNodeIds.size,
      relationships: this.highlightedRelIds.size,
    };
  }
}
