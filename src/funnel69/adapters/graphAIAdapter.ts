/**
 * 3D Memory Studio — Funnel 69
 * Graph AI Adapter (F58 Integration)
 */

import { GraphEngine } from '../../funnel58/graph/graphEngine';
import { isPermittedInWorkspace } from '../../funnel64/adapters/securityWorkspaceAdapter';
import { MAX_CONTEXT_RELATIONSHIPS, MAX_GRAPH_DEPTH } from '../context/contextLimits';

export interface GraphContextSummary {
  stateId: string;
  totalRelationships: number;
  relationships: readonly {
    id: string;
    targetId: string;
    type: string;
    strength: number;
  }[];
}

export class GraphAIAdapter {
  constructor(public readonly graphEngine?: GraphEngine) {}

  public getRelationshipsForState(stateId: string): readonly string[] {
    if (!this.graphEngine) return [];
    return this.graphEngine.registry
      .getBySource(stateId)
      .filter((r) => isPermittedInWorkspace(r.classification))
      .slice(0, MAX_CONTEXT_RELATIONSHIPS)
      .map((r) => r.relationshipId);
  }

  public getGraphContext(stateId: string, maxDepth: number = 1): GraphContextSummary {
    if (!this.graphEngine) {
      return {
        stateId,
        totalRelationships: 0,
        relationships: [],
      };
    }

    const depth = Math.min(maxDepth, MAX_GRAPH_DEPTH);
    const rels = this.graphEngine.registry
      .getBySource(stateId)
      .filter((r) => isPermittedInWorkspace(r.classification))
      .slice(0, MAX_CONTEXT_RELATIONSHIPS);

    return {
      stateId,
      totalRelationships: rels.length,
      relationships: rels.map((r) => ({
        id: r.relationshipId,
        targetId: r.targetStateId,
        type: r.relationshipType,
        strength: r.strength,
      })),
    };
  }

  public highlightRelationship(relId: string): boolean {
    if (!this.graphEngine) return true;
    const rel = this.graphEngine.registry.getRelationship(relId);
    if (!rel || !isPermittedInWorkspace(rel.classification)) {
      return false;
    }
    this.graphEngine.highlightManager.highlightNeighborhood(
      relId,
      this.graphEngine.model,
      this.graphEngine.registry
    );
    return true;
  }
}
