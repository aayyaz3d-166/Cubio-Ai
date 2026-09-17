/**
 * 3D Memory Studio — Funnel 85
 * Core: Distinguishability Analyzer
 */

import { F85ObjectViewRecord, F85ScreenCollisionReport } from '../types';

export function evaluateDistinguishability(
  records: readonly F85ObjectViewRecord[],
  thresholdPx = 16
): F85ScreenCollisionReport {
  const collisionPairs: [string, string][] = [];
  const uniquePositions = new Set<string>();

  for (let i = 0; i < records.length; i++) {
    const r1 = records[i];
    if (!r1.visible) continue;
    uniquePositions.add(`${Math.round(r1.screenPosition[0])},${Math.round(r1.screenPosition[1])}`);

    for (let j = i + 1; j < records.length; j++) {
      const r2 = records[j];
      if (!r2.visible) continue;

      const dx = r1.screenPosition[0] - r2.screenPosition[0];
      const dy = r1.screenPosition[1] - r2.screenPosition[1];
      const dist = Math.hypot(dx, dy);

      if (dist < thresholdPx) {
        collisionPairs.push([r1.id, r2.id]);
      }
    }
  }

  const collisionCount = collisionPairs.length;
  const uniqueScreenPositions = uniquePositions.size;
  const visuallyDistinctObjectCount = uniqueScreenPositions;
  const areAllDistinct = collisionCount === 0 && uniqueScreenPositions === records.length;

  return Object.freeze({
    collisionCount,
    collisionPairs: Object.freeze(collisionPairs),
    uniqueScreenPositions,
    visuallyDistinctObjectCount,
    thresholdPx,
    areAllDistinct,
  });
}
