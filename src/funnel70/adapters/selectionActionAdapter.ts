/**
 * 3D Memory Studio — Funnel 70
 * Selection Action Adapter (Single Selection Authority Synchronizer)
 */

import { SecurityActionAdapter } from './securityActionAdapter';

export class SelectionActionAdapter {
  private selectedStateId: string | null = null;
  private selectedClusterId: string | null = null;
  private selectedRelationshipId: string | null = null;

  constructor(private readonly security: SecurityActionAdapter = new SecurityActionAdapter()) {}

  public getSelectedStateId(): string | null {
    return this.selectedStateId;
  }

  public getSelectedClusterId(): string | null {
    return this.selectedClusterId;
  }

  public getSelectedRelationshipId(): string | null {
    return this.selectedRelationshipId;
  }

  public selectState(stateId: string | null): boolean {
    if (!stateId) {
      this.selectedStateId = null;
      return true;
    }
    if (!this.security.isTargetPermitted(stateId)) {
      return false; // RED blocked
    }
    this.selectedStateId = stateId;
    return true;
  }

  public selectCluster(clusterId: string | null): boolean {
    if (!clusterId) {
      this.selectedClusterId = null;
      return true;
    }
    if (!this.security.isTargetPermitted(clusterId)) {
      return false;
    }
    this.selectedClusterId = clusterId;
    return true;
  }

  public selectRelationship(relationshipId: string | null): boolean {
    if (!relationshipId) {
      this.selectedRelationshipId = null;
      return true;
    }
    if (!this.security.isTargetPermitted(relationshipId)) {
      return false;
    }
    this.selectedRelationshipId = relationshipId;
    return true;
  }

  public clearSelection(): void {
    this.selectedStateId = null;
    this.selectedClusterId = null;
    this.selectedRelationshipId = null;
  }
}
