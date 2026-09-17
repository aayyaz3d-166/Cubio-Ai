/**
 * 3D Memory Studio — Funnel 70
 * Cluster Action Adapter (F59 Integration)
 */

import { ClusterEngine } from '../../funnel59/cluster/clusterEngine';
import { ClusterLayoutMode } from '../../funnel59/types';
import { SecurityActionAdapter } from './securityActionAdapter';
import { VALID_CLUSTER_LAYOUTS } from '../actions/actionTypes';

export class ClusterActionAdapter {
  private isVisible = true;
  private currentLayout: ClusterLayoutMode = 'RADIAL';

  constructor(
    public readonly clusterEngine?: ClusterEngine,
    private readonly security: SecurityActionAdapter = new SecurityActionAdapter()
  ) {}

  public showClusters(): boolean {
    this.isVisible = true;
    if (this.clusterEngine) {
      this.clusterEngine.visibilityManager.setClustersVisibility(true, this.clusterEngine.registry);
    }
    return true;
  }

  public hideClusters(): boolean {
    this.isVisible = false;
    if (this.clusterEngine) {
      this.clusterEngine.visibilityManager.setClustersVisibility(false, this.clusterEngine.registry);
    }
    return true;
  }

  public changeClusterLayout(layout: ClusterLayoutMode): boolean {
    if (!VALID_CLUSTER_LAYOUTS.has(layout)) return false;
    this.currentLayout = layout;
    if (this.clusterEngine) {
      this.clusterEngine.setLayoutMode(layout);
    }
    return true;
  }

  public highlightCluster(clusterId: string): boolean {
    if (!this.security.isTargetPermitted(clusterId)) return false;
    if (this.clusterEngine) {
      this.clusterEngine.highlightManager.highlightCluster(clusterId, this.clusterEngine.registry);
    }
    return true;
  }

  public getIsVisible(): boolean {
    return this.isVisible;
  }

  public getCurrentLayout(): ClusterLayoutMode {
    return this.currentLayout;
  }
}
