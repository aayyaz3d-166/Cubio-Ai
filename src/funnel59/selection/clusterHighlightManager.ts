/**
 * 3D Memory Studio — Funnel 59
 * Cluster Highlight Manager & Search Synchronization
 */

import { ClusterRegistry } from '../cluster/clusterRegistry';
import { Cluster } from '../types';

export class ClusterHighlightManager {
  private highlightedClusterIds: Set<string> = new Set();

  public highlightCluster(clusterId: string | null, registry: ClusterRegistry): void {
    this.clearHighlights(registry);
    if (!clusterId) return;

    this.highlightedClusterIds.add(clusterId);
    const cluster = registry.getCluster(clusterId);
    if (cluster) cluster.highlighted = true;
  }

  public highlightByStateId(stateId: string, registry: ClusterRegistry): number {
    this.clearHighlights(registry);
    const clusters = registry.getByState(stateId);

    for (const c of clusters) {
      this.highlightedClusterIds.add(c.clusterId);
      c.highlighted = true;
    }

    return clusters.length;
  }

  public highlightBySearchQuery(query: string, registry: ClusterRegistry): number {
    this.clearHighlights(registry);
    if (!query || query.trim() === '') return 0;

    const lower = query.toLowerCase();
    let count = 0;

    for (const c of registry.getAll()) {
      if (
        c.name.toLowerCase().includes(lower) ||
        c.clusterType.toLowerCase().includes(lower) ||
        c.memberStateIds.some((s) => s.toLowerCase().includes(lower))
      ) {
        this.highlightedClusterIds.add(c.clusterId);
        c.highlighted = true;
        count++;
      }
    }

    return count;
  }

  public clearHighlights(registry: ClusterRegistry): void {
    this.highlightedClusterIds.clear();
    for (const c of registry.getAll()) {
      c.highlighted = false;
    }
  }

  public get highlightedCount(): number {
    return this.highlightedClusterIds.size;
  }
}
