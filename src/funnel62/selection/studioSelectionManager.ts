/**
 * 3D Memory Studio — Funnel 62
 * Authoritative Studio Selection Manager
 */

export class StudioSelectionManager {
  private selectedStateId: string | null = null;
  private selectedClusterId: string | null = null;
  private selectedRelationshipId: string | null = null;

  public selectState(stateId: string | null): void {
    this.selectedStateId = stateId;
    if (stateId) {
      this.selectedRelationshipId = null;
    }
  }

  public selectCluster(clusterId: string | null): void {
    this.selectedClusterId = clusterId;
  }

  public selectRelationship(relId: string | null): void {
    this.selectedRelationshipId = relId;
  }

  public clearSelection(): void {
    this.selectedStateId = null;
    this.selectedClusterId = null;
    this.selectedRelationshipId = null;
  }

  public get currentStateId(): string | null {
    return this.selectedStateId;
  }

  public get currentClusterId(): string | null {
    return this.selectedClusterId;
  }

  public get currentRelationshipId(): string | null {
    return this.selectedRelationshipId;
  }
}
