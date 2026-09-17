/**
 * 3D Memory Studio — Funnel 59
 * Cluster Membership Manager
 */

import { ClusterRegistry } from './clusterRegistry';
import { Cluster } from '../types';

export class ClusterMembershipManager {
  public addMember(
    clusterId: string,
    stateId: string,
    registry: ClusterRegistry
  ): boolean {
    const cluster = registry.getCluster(clusterId);
    if (!cluster) return false;

    if (!cluster.memberStateIds.includes(stateId)) {
      cluster.memberStateIds.push(stateId);
      // Re-register to update reverse lookup index
      registry.removeCluster(clusterId);
      registry.registerCluster(cluster);
      return true;
    }
    return false;
  }

  public removeMember(
    clusterId: string,
    stateId: string,
    registry: ClusterRegistry,
    cleanupEmpty = true
  ): boolean {
    const cluster = registry.getCluster(clusterId);
    if (!cluster) return false;

    const idx = cluster.memberStateIds.indexOf(stateId);
    if (idx !== -1) {
      cluster.memberStateIds.splice(idx, 1);

      if (cleanupEmpty && cluster.memberStateIds.length === 0) {
        registry.removeCluster(clusterId);
        return true;
      }

      registry.removeCluster(clusterId);
      registry.registerCluster(cluster);
      return true;
    }
    return false;
  }

  public getMembers(clusterId: string, registry: ClusterRegistry): readonly string[] {
    const cluster = registry.getCluster(clusterId);
    return cluster ? cluster.memberStateIds : [];
  }

  public getClustersForState(stateId: string, registry: ClusterRegistry): readonly Cluster[] {
    return registry.getByState(stateId);
  }
}
