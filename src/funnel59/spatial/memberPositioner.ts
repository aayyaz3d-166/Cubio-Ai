/**
 * 3D Memory Studio — Funnel 59
 * Deterministic Member State Positioner
 *
 * Positions member states around cluster center using deterministic Fibonacci spherical lattice.
 */

import { Cluster } from '../types';

export function positionMembersInCluster(
  cluster: Cluster,
  memberStateIds: readonly string[]
): Map<string, [number, number, number]> {
  const memberPositions = new Map<string, [number, number, number]>();
  const n = memberStateIds.length;
  if (n === 0) return memberPositions;

  if (n === 1) {
    memberPositions.set(memberStateIds[0], [...cluster.center]);
    return memberPositions;
  }

  const [cx, cy, cz] = cluster.center;
  const spreadRadius = Math.max(15, cluster.radius * 0.65);
  const goldenRatio = (1 + Math.sqrt(5)) / 2;

  for (let i = 0; i < n; i++) {
    const stateId = memberStateIds[i];
    const theta = 2 * Math.PI * i * (1 / goldenRatio);
    const phi = Math.acos(1 - (2 * (i + 0.5)) / n);

    const x = cx + spreadRadius * Math.sin(phi) * Math.cos(theta);
    const y = cy + spreadRadius * Math.cos(phi) * 0.4; // Slightly flattened along Y
    const z = cz + spreadRadius * Math.sin(phi) * Math.sin(theta);

    memberPositions.set(stateId, [
      Number(x.toFixed(3)),
      Number(y.toFixed(3)),
      Number(z.toFixed(3)),
    ]);
  }

  return memberPositions;
}
