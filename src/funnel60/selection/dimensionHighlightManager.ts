/**
 * 3D Memory Studio — Funnel 60
 * Dimension Highlight Manager
 *
 * Preserves selection and search highlights across dimension changes.
 */

export class DimensionHighlightManager {
  private highlightedStateIds: Set<string> = new Set();
  private highlightedClusterIds: Set<string> = new Set();
  private activeSearchQuery = '';

  public setHighlightedStates(stateIds: readonly string[]): void {
    this.highlightedStateIds = new Set(stateIds);
  }

  public setHighlightedClusters(clusterIds: readonly string[]): void {
    this.highlightedClusterIds = new Set(clusterIds);
  }

  public setSearchQuery(query: string): void {
    this.activeSearchQuery = query;
  }

  public isStateHighlighted(stateId: string): boolean {
    return this.highlightedStateIds.has(stateId);
  }

  public isClusterHighlighted(clusterId: string): boolean {
    return this.highlightedClusterIds.has(clusterId);
  }

  public get searchQuery(): string {
    return this.activeSearchQuery;
  }

  public clearHighlights(): void {
    this.highlightedStateIds.clear();
    this.highlightedClusterIds.clear();
    this.activeSearchQuery = '';
  }
}
