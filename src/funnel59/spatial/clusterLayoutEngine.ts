/**
 * 3D Memory Studio — Funnel 59
 * Cluster Spatial Layout Engine
 *
 * Implements deterministic RADIAL, GRID, ORBITAL, and HIERARCHICAL layouts.
 */

import { Cluster, ClusterLayoutMode } from '../types';
import { resolveClusterOverlaps } from './clusterOverlapResolver';

export function applyClusterLayout(
  clusters: Cluster[],
  mode: ClusterLayoutMode = 'RADIAL',
  baseRadius = 220
): void {
  const n = clusters.length;
  if (n === 0) return;

  switch (mode) {
    case 'GRID': {
      const cols = Math.ceil(Math.sqrt(n));
      const spacing = 180;
      const startX = -((cols - 1) * spacing) / 2;
      const startZ = -((Math.ceil(n / cols) - 1) * spacing) / 2;

      for (let i = 0; i < n; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        clusters[i].center = [
          Number((startX + col * spacing).toFixed(3)),
          0,
          Number((startZ + row * spacing).toFixed(3)),
        ];
      }
      break;
    }

    case 'ORBITAL': {
      for (let i = 0; i < n; i++) {
        const orbitTier = (i % 3) + 1; // 1, 2, 3
        const r = baseRadius * (0.6 + orbitTier * 0.4);
        const angle = (2 * Math.PI * i) / n;
        const elevation = ((i % 2 === 0 ? 1 : -1) * 30 * orbitTier);

        clusters[i].center = [
          Number((Math.cos(angle) * r).toFixed(3)),
          elevation,
          Number((Math.sin(angle) * r).toFixed(3)),
        ];
      }
      break;
    }

    case 'HIERARCHICAL': {
      const domainClusters = clusters.filter((c) => c.clusterType === 'DOMAIN');
      const otherClusters = clusters.filter((c) => c.clusterType !== 'DOMAIN');

      // Domain clusters in upper ring
      for (let i = 0; i < domainClusters.length; i++) {
        const angle = (2 * Math.PI * i) / Math.max(1, domainClusters.length);
        domainClusters[i].center = [
          Number((Math.cos(angle) * 140).toFixed(3)),
          60,
          Number((Math.sin(angle) * 140).toFixed(3)),
        ];
      }

      // Other clusters in lower outer ring
      for (let i = 0; i < otherClusters.length; i++) {
        const angle = (2 * Math.PI * i) / Math.max(1, otherClusters.length);
        otherClusters[i].center = [
          Number((Math.cos(angle) * 260).toFixed(3)),
          -40,
          Number((Math.sin(angle) * 260).toFixed(3)),
        ];
      }
      break;
    }

    case 'DOMAIN_RADIAL':
    case 'RADIAL':
    default: {
      for (let i = 0; i < n; i++) {
        const angle = (2 * Math.PI * i) / n;
        const r = baseRadius + (i % 2 === 0 ? 30 : -20);
        clusters[i].center = [
          Number((Math.cos(angle) * r).toFixed(3)),
          Number(((i % 3 - 1) * 25).toFixed(3)),
          Number((Math.sin(angle) * r).toFixed(3)),
        ];
      }
      break;
    }
  }

  // Resolve overlaps deterministically
  resolveClusterOverlaps(clusters);
}
