/**
 * 3D Memory Studio — Funnel 58
 * Graph Selection Manager
 */

import { GraphRegistry } from '../graph/graphRegistry';
import { GraphModel } from '../graph/graphModel';
import { GraphRelationship, GraphNode } from '../types';

export class GraphSelectionManager {
  private selectedNodeId: string | null = null;
  private selectedRelationshipId: string | null = null;

  public selectNode(nodeId: string | null, model: GraphModel, registry: GraphRegistry): void {
    this.selectedNodeId = nodeId;

    // Update node selection flag
    for (const node of model.getAllNodes()) {
      node.selected = node.stateId === nodeId;
    }

    // Update connected edges selection flag
    for (const rel of registry.getAll()) {
      rel.selected = nodeId !== null && (rel.sourceStateId === nodeId || rel.targetStateId === nodeId);
    }
  }

  public selectRelationship(relId: string | null, registry: GraphRegistry): GraphRelationship | null {
    this.selectedRelationshipId = relId;

    let selectedRel: GraphRelationship | null = null;
    for (const rel of registry.getAll()) {
      const isSelected = rel.relationshipId === relId;
      rel.selected = isSelected;
      if (isSelected) selectedRel = rel;
    }

    return selectedRel;
  }

  public clearSelection(model: GraphModel, registry: GraphRegistry): void {
    this.selectedNodeId = null;
    this.selectedRelationshipId = null;

    for (const node of model.getAllNodes()) {
      node.selected = false;
    }
    for (const rel of registry.getAll()) {
      rel.selected = false;
    }
  }

  public getSelectedNodeId(): string | null {
    return this.selectedNodeId;
  }

  public getSelectedRelationshipId(): string | null {
    return this.selectedRelationshipId;
  }
}
