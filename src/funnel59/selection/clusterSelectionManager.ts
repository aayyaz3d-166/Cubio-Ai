/**
 * 3D Memory Studio — Funnel 59
 * Cluster Selection Manager
 */

import { ClusterRegistry } from '../cluster/clusterRegistry';
import { Cluster } from '../types';

export class ClusterSelectionManager {
  private selectedClusterId: string | null = null;

  public selectCluster(clusterId: string | null, registry: ClusterRegistry): Cluster | null {
    this.selectedClusterId = clusterId;
    let selected: Cluster | null = null;

    for (const cluster of registry.getAll()) {
      const isSelected = cluster.clusterId === clusterId;
      cluster.selected = isSelected;
      if (isSelected) selected = cluster;
    }

    return selected;
  }

  public clearSelection(registry: ClusterRegistry): void {
    this.selectedClusterId = null;
    for (const cluster of registry.getAll()) {
      cluster.selected = false;
    }
  }

  public getSelectedClusterId(): string | null {
    return this.selectedClusterId;
  }
}
