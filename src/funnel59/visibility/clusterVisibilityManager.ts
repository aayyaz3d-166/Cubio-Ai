/**
 * 3D Memory Studio — Funnel 59
 * Cluster Visibility Manager
 */

import { ClusterRegistry } from '../cluster/clusterRegistry';
import { ClusterType } from '../types';

export class ClusterVisibilityManager {
  private isClustersVisible = true;
  private typeVisibility: Map<ClusterType, boolean> = new Map([
    ['DOMAIN', true],
    ['CATEGORY', true],
    ['SEMANTIC', true],
    ['SOURCE', true],
    ['SEQUENCE', true],
    ['COORDINATE', true],
  ]);

  public setClustersVisibility(visible: boolean, registry: ClusterRegistry): void {
    this.isClustersVisible = visible;
    for (const cluster of registry.getAll()) {
      cluster.visible = visible && (this.typeVisibility.get(cluster.clusterType) ?? true);
    }
  }

  public setTypeVisibility(
    type: ClusterType,
    visible: boolean,
    registry: ClusterRegistry
  ): void {
    this.typeVisibility.set(type, visible);
    if (this.isClustersVisible) {
      for (const cluster of registry.getByType(type)) {
        cluster.visible = visible;
      }
    }
  }

  public isTypeVisible(type: ClusterType): boolean {
    return this.typeVisibility.get(type) ?? true;
  }

  public get visible(): boolean {
    return this.isClustersVisible;
  }
}
