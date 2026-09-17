/**
 * 3D Memory Studio — Funnel 64
 * Graph Workspace Adapter
 *
 * Exposes F58 Graph Engine relationships and neighborhood highlighting.
 */

import { GraphEngine } from '../../funnel58/graph/graphEngine';
import { GraphRelationship } from '../../funnel58/types';

export class GraphWorkspaceAdapter {
  constructor(public readonly graphEngine: GraphEngine) {}

  public getRelationshipsForState(stateId: string): readonly GraphRelationship[] {
    return this.graphEngine.registry.getBySource(stateId);
  }

  public getAllRelationships(): readonly GraphRelationship[] {
    return this.graphEngine.registry.getAll();
  }

  public highlightNode(stateId: string | null): void {
    if (stateId) {
      this.graphEngine.highlightManager.highlightNeighborhood(
        stateId,
        this.graphEngine.model,
        this.graphEngine.registry
      );
    } else {
      this.graphEngine.highlightManager.clearHighlights(
        this.graphEngine.model,
        this.graphEngine.registry
      );
    }
  }
}
