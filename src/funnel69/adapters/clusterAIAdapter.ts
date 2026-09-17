/**
 * 3D Memory Studio — Funnel 69
 * Cluster AI Adapter (F59 Integration)
 */

import { ClusterEngine } from '../../funnel59/cluster/clusterEngine';
import { isPermittedInWorkspace } from '../../funnel64/adapters/securityWorkspaceAdapter';
import { MAX_CONTEXT_CLUSTERS } from '../context/contextLimits';

export interface ClusterSummary {
  clusterId: string;
  name: string;
  type: string;
  memberCount: number;
  center: readonly [number, number, number];
  radius: number;
}

export class ClusterAIAdapter {
  constructor(public readonly clusterEngine?: ClusterEngine) {}

  public getCluster(clusterId: string): ClusterSummary | undefined {
    if (!this.clusterEngine) return undefined;
    const cluster = this.clusterEngine.registry.getCluster(clusterId);
    if (!cluster || !isPermittedInWorkspace(cluster.classification)) {
      return undefined;
    }
    return {
      clusterId: cluster.clusterId,
      name: cluster.name,
      type: cluster.clusterType,
      memberCount: cluster.memberStateIds.length,
      center: cluster.center,
      radius: cluster.radius,
    };
  }

  public getClusterForState(stateId: string): ClusterSummary | undefined {
    if (!this.clusterEngine) return undefined;
    const clusters = this.clusterEngine.registry.getByState(stateId);
    const permitted = clusters.filter((c) => isPermittedInWorkspace(c.classification));
    if (permitted.length === 0) return undefined;
    const c = permitted[0];
    return {
      clusterId: c.clusterId,
      name: c.name,
      type: c.clusterType,
      memberCount: c.memberStateIds.length,
      center: c.center,
      radius: c.radius,
    };
  }

  public getAllPermittedClusters(): readonly ClusterSummary[] {
    if (!this.clusterEngine) return [];
    return this.clusterEngine.registry
      .getAll()
      .filter((c) => isPermittedInWorkspace(c.classification))
      .slice(0, MAX_CONTEXT_CLUSTERS)
      .map((c) => ({
        clusterId: c.clusterId,
        name: c.name,
        type: c.clusterType,
        memberCount: c.memberStateIds.length,
        center: c.center,
        radius: c.radius,
      }));
  }

  public highlightCluster(clusterId: string): boolean {
    if (!this.clusterEngine) return true;
    const cluster = this.clusterEngine.registry.getCluster(clusterId);
    if (!cluster || !isPermittedInWorkspace(cluster.classification)) {
      return false;
    }
    this.clusterEngine.highlightManager.highlightCluster(clusterId, this.clusterEngine.registry);
    return true;
  }
}
