/**
 * 3D Memory Studio — Funnel 59
 * Deterministic Cluster Overlap Resolver
 *
 * Enforces minimum inter-cluster distances without non-deterministic physics engines.
 */

import { Cluster } from '../types';

export function resolveClusterOverlaps(
  clusters: Cluster[],
  minBuffer = 40,
  maxPasses = 3
): void {
  for (let pass = 0; pass < maxPasses; pass++) {
    let overlapFound = false;

    for (let i = 0; i < clusters.length; i++) {
      for (let j = i + 1; j < clusters.length; j++) {
        const c1 = clusters[i];
        const c2 = clusters[j];

        const dx = c2.center[0] - c1.center[0];
        const dy = c2.center[1] - c1.center[1];
        const dz = c2.center[2] - c1.center[2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        const reqDist = c1.radius + c2.radius + minBuffer;

        if (dist < reqDist && dist > 0.001) {
          overlapFound = true;
          const overlap = (reqDist - dist) * 0.5;
          const nx = dx / dist;
          const ny = dy / dist;
          const nz = dz / dist;

          // Push centers apart along normal
          c1.center[0] = Number((c1.center[0] - nx * overlap).toFixed(3));
          c1.center[1] = Number((c1.center[1] - ny * overlap).toFixed(3));
          c1.center[2] = Number((c1.center[2] - nz * overlap).toFixed(3));

          c2.center[0] = Number((c2.center[0] + nx * overlap).toFixed(3));
          c2.center[1] = Number((c2.center[1] + ny * overlap).toFixed(3));
          c2.center[2] = Number((c2.center[2] + nz * overlap).toFixed(3));
        }
      }
    }

    if (!overlapFound) break;
  }
}
