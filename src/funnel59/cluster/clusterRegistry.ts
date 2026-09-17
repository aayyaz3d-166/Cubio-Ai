/**
 * 3D Memory Studio — Funnel 59
 * Cluster Registry with Indexed State Membership Lookups
 */

import { Cluster, ClusterType } from '../types';

export class ClusterRegistry {
  private clustersById: Map<string, Cluster> = new Map();
  private typeIndex: Map<ClusterType, Set<string>> = new Map();
  private stateToClusters: Map<string, Set<string>> = new Map();

  public registerCluster(cluster: Cluster): boolean {
    if (this.clustersById.has(cluster.clusterId)) {
      return false; // Prevent duplicate IDs
    }

    this.clustersById.set(cluster.clusterId, cluster);

    // Index by type
    let typeSet = this.typeIndex.get(cluster.clusterType);
    if (!typeSet) {
      typeSet = new Set();
      this.typeIndex.set(cluster.clusterType, typeSet);
    }
    typeSet.add(cluster.clusterId);

    // Index by member states
    for (const stateId of cluster.memberStateIds) {
      let stateSet = this.stateToClusters.get(stateId);
      if (!stateSet) {
        stateSet = new Set();
        this.stateToClusters.set(stateId, stateSet);
      }
      stateSet.add(cluster.clusterId);
    }

    return true;
  }

  public removeCluster(id: string): boolean {
    const cluster = this.clustersById.get(id);
    if (!cluster) return false;

    this.clustersById.delete(id);
    this.typeIndex.get(cluster.clusterType)?.delete(id);

    for (const stateId of cluster.memberStateIds) {
      this.stateToClusters.get(stateId)?.delete(id);
    }

    return true;
  }

  public getCluster(id: string): Cluster | undefined {
    return this.clustersById.get(id);
  }

  public hasCluster(id: string): boolean {
    return this.clustersById.has(id);
  }

  public getByType(type: ClusterType): readonly Cluster[] {
    const ids = this.typeIndex.get(type);
    if (!ids) return [];
    const list: Cluster[] = [];
    for (const id of ids) {
      const c = this.clustersById.get(id);
      if (c) list.push(c);
    }
    return list;
  }

  public getByState(stateId: string): readonly Cluster[] {
    const ids = this.stateToClusters.get(stateId);
    if (!ids) return [];
    const list: Cluster[] = [];
    for (const id of ids) {
      const c = this.clustersById.get(id);
      if (c) list.push(c);
    }
    return list;
  }

  public getAll(): readonly Cluster[] {
    return Array.from(this.clustersById.values());
  }

  public getVisible(): readonly Cluster[] {
    const list: Cluster[] = [];
    for (const c of this.clustersById.values()) {
      if (c.visible) list.push(c);
    }
    return list;
  }

  public get count(): number {
    return this.clustersById.size;
  }

  public clear(): void {
    this.clustersById.clear();
    this.typeIndex.clear();
    this.stateToClusters.clear();
  }
}
