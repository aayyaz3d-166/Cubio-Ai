/**
 * 3D Memory Studio — Funnel 59
 * Cluster Priority & Budget Bounding Engine
 *
 * Deterministically bounds visible clusters to <= 20.
 */

import { Cluster } from '../types';

export const MAX_VISIBLE_CLUSTERS = 20;

export function prioritizeAndBoundClusters(
  clusters: readonly Cluster[],
  selectedClusterId: string | null = null,
  selectedNodeId: string | null = null,
  maxClusters = MAX_VISIBLE_CLUSTERS
): Cluster[] {
  const sorted = [...clusters].sort((a, b) => {
    // 1. Selected cluster first
    if (selectedClusterId) {
      if (a.clusterId === selectedClusterId && b.clusterId !== selectedClusterId) return -1;
      if (a.clusterId !== selectedClusterId && b.clusterId === selectedClusterId) return 1;
    }

    // 2. Highlighted clusters second
    if (a.highlighted && !b.highlighted) return -1;
    if (!a.highlighted && b.highlighted) return 1;

    // 3. Cluster containing selected node third
    if (selectedNodeId) {
      const aHas = a.memberStateIds.includes(selectedNodeId);
      const bHas = b.memberStateIds.includes(selectedNodeId);
      if (aHas && !bHas) return -1;
      if (!aHas && bHas) return 1;
    }

    // 4. Highest membership count fourth
    if (b.memberStateIds.length !== a.memberStateIds.length) {
      return b.memberStateIds.length - a.memberStateIds.length;
    }

    // 5. Highest density fifth
    if (b.metrics.density !== a.metrics.density) {
      return b.metrics.density - a.metrics.density;
    }

    // 6. Deterministic string tie-breaker
    return a.clusterId.localeCompare(b.clusterId);
  });

  for (let i = 0; i < sorted.length; i++) {
    sorted[i].visible = i < maxClusters;
  }

  return sorted.slice(0, maxClusters);
}
