/**
 * 3D Memory Studio — Funnel 64
 * Workspace Selection Manager & F47 Security Gate
 */

import { DataClassification } from '../../funnel47/types';

export class WorkspaceSelectionManager {
  private selectedStateId: string | null = null;
  private selectedRelationshipId: string | null = null;
  private selectedClusterId: string | null = null;

  public selectState(stateId: string | null, classification: DataClassification = 'GREEN'): boolean {
    if (!stateId) {
      this.selectedStateId = null;
      return true;
    }

    // F47 Security Enforcement: RED records must NEVER become selected objects
    if (classification === 'RED') {
      return false;
    }

    this.selectedStateId = stateId;
    this.selectedRelationshipId = null; // Single entity focus
    return true;
  }

  public selectRelationship(relId: string | null, classification: DataClassification = 'GREEN'): boolean {
    if (!relId) {
      this.selectedRelationshipId = null;
      return true;
    }

    if (classification === 'RED') {
      return false;
    }

    this.selectedRelationshipId = relId;
    return true;
  }

  public selectCluster(clusterId: string | null, classification: DataClassification = 'GREEN'): boolean {
    if (!clusterId) {
      this.selectedClusterId = null;
      return true;
    }

    if (classification === 'RED') {
      return false;
    }

    this.selectedClusterId = clusterId;
    return true;
  }

  public clearSelection(): void {
    this.selectedStateId = null;
    this.selectedRelationshipId = null;
    this.selectedClusterId = null;
  }

  public get currentStateId(): string | null {
    return this.selectedStateId;
  }

  public get currentRelationshipId(): string | null {
    return this.selectedRelationshipId;
  }

  public get currentClusterId(): string | null {
    return this.selectedClusterId;
  }
}
