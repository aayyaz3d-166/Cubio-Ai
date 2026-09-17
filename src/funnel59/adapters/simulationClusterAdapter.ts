/**
 * 3D Memory Studio — Funnel 59
 * Simulation Cluster Synchronizer Adapter
 *
 * Derives categorical and domain clusters from simulation world and graph registry.
 */

import { SimulationWorldState } from '../../funnel52/types';
import { GraphRegistry } from '../../funnel58/graph/graphRegistry';
import { ClusterRegistry } from '../cluster/clusterRegistry';
import { resolveCluster } from '../cluster/clusterResolver';
import { calculateClusterMetrics } from '../cluster/clusterQueries';
import { applyClusterLayout } from '../spatial/clusterLayoutEngine';
import { prioritizeAndBoundClusters } from '../cluster/clusterPrioritizer';
import { ClusterLayoutMode } from '../types';
import { filterSecureClusterMembers } from './securityClusterAdapter';

export function synchronizeSimulationToClusters(
  world: SimulationWorldState,
  graphRegistry: GraphRegistry,
  clusterRegistry: ClusterRegistry,
  layoutMode: ClusterLayoutMode = 'RADIAL'
): void {
  clusterRegistry.clear();

  const sourceList = world.allSourceStates && world.allSourceStates.length > 0
    ? world.allSourceStates
    : (world.activeNodes || []);

  const greenMembers = filterSecureClusterMembers(sourceList);
  if (greenMembers.length === 0) return;

  // 1. Group by Category
  const categoryMap: Map<string, typeof greenMembers> = new Map();
  for (const s of greenMembers) {
    const cat = s.category || 'GENERAL';
    let list = categoryMap.get(cat);
    if (!list) {
      list = [];
      categoryMap.set(cat, list);
    }
    list.push(s);
  }

  for (const [catName, members] of categoryMap.entries()) {
    const cluster = resolveCluster('CATEGORY', catName, members, world.activeDimension);
    if (cluster) {
      calculateClusterMetrics(cluster, graphRegistry);
      clusterRegistry.registerCluster(cluster);
    }
  }

  // 2. Group by Domain if available
  const domainMap: Map<string, typeof greenMembers> = new Map();
  for (const s of greenMembers) {
    const dom = 'sourceDomain' in s ? (s.sourceDomain as string) : 'research.local';
    let list = domainMap.get(dom);
    if (!list) {
      list = [];
      domainMap.set(dom, list);
    }
    list.push(s);
  }

  for (const [domName, members] of domainMap.entries()) {
    if (members.length >= 2) {
      const cluster = resolveCluster('DOMAIN', domName, members, world.activeDimension);
      if (cluster) {
        calculateClusterMetrics(cluster, graphRegistry);
        clusterRegistry.registerCluster(cluster);
      }
    }
  }

  // 3. Apply deterministic layout
  const allClusters = clusterRegistry.getAll() as import('../types').Cluster[];
  applyClusterLayout(allClusters, layoutMode);

  // 4. Prioritize & enforce budget
  prioritizeAndBoundClusters(allClusters, null, null);
}
