/**
 * 3D Memory Studio — Funnel 64
 * Cluster Workspace Adapter
 *
 * Exposes F59 Cluster Engine spatial groups and cluster highlights.
 */

import { ClusterEngine } from '../../funnel59/cluster/clusterEngine';
import { Cluster } from '../../funnel59/types';

export class ClusterWorkspaceAdapter {
  constructor(public readonly clusterEngine: ClusterEngine) {}

  public getClustersForState(stateId: string): readonly Cluster[] {
    return this.clusterEngine.registry.getByState(stateId);
  }

  public getAllClusters(): readonly Cluster[] {
    return this.clusterEngine.registry.getAll();
  }

  public highlightClusterForState(stateId: string | null): void {
    if (stateId) {
      this.clusterEngine.highlightManager.highlightByStateId(
        stateId,
        this.clusterEngine.registry
      );
    } else {
      this.clusterEngine.highlightManager.clearHighlights(this.clusterEngine.registry);
    }
  }
}
