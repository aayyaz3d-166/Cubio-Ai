/**
 * 3D Memory Studio — Funnel 70
 * Graph Action Adapter (F58 Integration)
 */

import { GraphEngine } from '../../funnel58/graph/graphEngine';
import { SecurityActionAdapter } from './securityActionAdapter';

export class GraphActionAdapter {
  private isVisible = true;

  constructor(
    public readonly graphEngine?: GraphEngine,
    private readonly security: SecurityActionAdapter = new SecurityActionAdapter()
  ) {}

  public showGraph(): boolean {
    this.isVisible = true;
    if (this.graphEngine) {
      this.graphEngine.visibilityManager.setGraphVisibility(true, this.graphEngine.registry);
    }
    return true;
  }

  public hideGraph(): boolean {
    this.isVisible = false;
    if (this.graphEngine) {
      this.graphEngine.visibilityManager.setGraphVisibility(false, this.graphEngine.registry);
    }
    return true;
  }

  public highlightRelationship(relationshipId: string): boolean {
    if (!this.security.isTargetPermitted(relationshipId)) return false;
    if (this.graphEngine) {
      this.graphEngine.highlightManager.highlightNeighborhood(
        relationshipId,
        this.graphEngine.model,
        this.graphEngine.registry
      );
    }
    return true;
  }

  public highlightNeighborhood(stateId: string): boolean {
    if (!this.security.isTargetPermitted(stateId)) return false;
    if (this.graphEngine) {
      this.graphEngine.highlightManager.highlightNeighborhood(
        stateId,
        this.graphEngine.model,
        this.graphEngine.registry
      );
    }
    return true;
  }

  public filterGraph(): boolean {
    return true;
  }

  public getIsVisible(): boolean {
    return this.isVisible;
  }
}
