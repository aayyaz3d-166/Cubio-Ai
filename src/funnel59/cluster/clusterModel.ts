/**
 * 3D Memory Studio — Funnel 59
 * Cluster Model & Spatial Mathematics
 */

import { Cluster, ClusterType, ClusterMetrics } from '../types';

export function calculateClusterCenter(
  positions: readonly [number, number, number][]
): [number, number, number] {
  if (positions.length === 0) return [0, 0, 0];

  let sumX = 0;
  let sumY = 0;
  let sumZ = 0;

  for (const pos of positions) {
    sumX += pos[0];
    sumY += pos[1];
    sumZ += pos[2];
  }

  const n = positions.length;
  return [
    Number((sumX / n).toFixed(3)),
    Number((sumY / n).toFixed(3)),
    Number((sumZ / n).toFixed(3)),
  ];
}

export function calculateClusterBounds(
  positions: readonly [number, number, number][]
): { min: [number, number, number]; max: [number, number, number] } {
  if (positions.length === 0) {
    return { min: [0, 0, 0], max: [0, 0, 0] };
  }

  let minX = Infinity;
  let minY = Infinity;
  let minZ = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let maxZ = -Infinity;

  for (const [x, y, z] of positions) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (z < minZ) minZ = z;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
    if (z > maxZ) maxZ = z;
  }

  return {
    min: [minX, minY, minZ],
    max: [maxX, maxY, maxZ],
  };
}

export function calculateClusterRadius(
  positions: readonly [number, number, number][],
  center: [number, number, number],
  minPadding = 25
): number {
  if (positions.length === 0) return minPadding;

  let maxDistSq = 0;
  const [cx, cy, cz] = center;

  for (const [x, y, z] of positions) {
    const dx = x - cx;
    const dy = y - cy;
    const dz = z - cz;
    const distSq = dx * dx + dy * dy + dz * dz;
    if (distSq > maxDistSq) {
      maxDistSq = distSq;
    }
  }

  return Number((Math.sqrt(maxDistSq) + minPadding).toFixed(3));
}

export function getClusterTypeColor(type: ClusterType): string {
  switch (type) {
    case 'DOMAIN': return '#a855f7'; // Purple
    case 'CATEGORY': return '#34d399'; // Emerald
    case 'SEMANTIC': return '#38bdf8'; // Cyan
    case 'SOURCE': return '#fbbf24'; // Amber
    case 'SEQUENCE': return '#60a5fa'; // Blue
    case 'COORDINATE':
    default: return '#fb7185'; // Rose
  }
}
