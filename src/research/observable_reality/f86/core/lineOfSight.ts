/**
 * 3D Memory Studio — Funnel 86
 * Core: Line of Sight (LOS) Raycasting & Interception Model
 */

import { F86LineOfSightRecord, F86ObserverState } from '../types';

export function calculateLineOfSight(
  observer: F86ObserverState,
  targetId: string,
  targetPos: readonly number[],
  allObjects: readonly { id: string; pos: readonly number[]; radius: number }[]
): F86LineOfSightRecord {
  const [ox, oy, oz] = observer.position;
  const [tx = 0, ty = 0, tz = 0] = targetPos;

  const dx = tx - ox;
  const dy = ty - oy;
  const dz = tz - oz;
  const distance = Math.hypot(dx, dy, dz) || 0.001;

  const dir: [number, number, number] = [
    Number((dx / distance).toFixed(4)),
    Number((dy / distance).toFixed(4)),
    Number((dz / distance).toFixed(4)),
  ];

  let blockedBy: string | null = null;

  for (const other of allObjects) {
    if (other.id === targetId) continue;
    const [px = 0, py = 0, pz = 0] = other.pos;

    // Vector from observer to potential blocker
    const bx = px - ox;
    const by = py - oy;
    const bz = pz - oz;
    const bDist = Math.hypot(bx, by, bz);

    // Blocker must be closer than target
    if (bDist < distance && bDist > 0.1) {
      // Projection of blocker vector onto ray direction
      const dot = bx * dir[0] + by * dir[1] + bz * dir[2];
      if (dot > 0 && dot < distance) {
        // Perpendicular distance from blocker center to ray line
        const perpSq = bDist * bDist - dot * dot;
        const perpDist = Math.sqrt(Math.max(0, perpSq));
        if (perpDist < (other.radius || 2.5)) {
          blockedBy = other.id;
          break;
        }
      }
    }
  }

  return {
    observerId: observer.observerId,
    targetId,
    direction: dir,
    distance: Number(distance.toFixed(4)),
    depth: Number(distance.toFixed(4)),
    lineOfSight: blockedBy ? 'BLOCKED' : 'CLEAR',
    blockedBy,
  };
}
