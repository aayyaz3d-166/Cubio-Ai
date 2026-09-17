/**
 * 3D Memory Studio — Funnel 86
 * Analysis: Depth Ordering & Z-Range Evaluator
 */

import { F86DisplayState, F86DepthOrderingReport } from '../types';

export function evaluateDepthOrdering(display: F86DisplayState): F86DepthOrderingReport {
  const sorted = [...display.objectRecords].sort((a, b) => a.depthZ - b.depthZ);
  const sortedObjectIdsByDepth = sorted.map((r) => r.id);

  let isStrictlyOrdered = true;
  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i].depthZ >= sorted[i + 1].depthZ) {
      // Multiple objects with exact same depth
      isStrictlyOrdered = false;
      break;
    }
  }

  const minDepth = sorted.length > 0 ? sorted[0].depthZ : 0;
  const maxDepth = sorted.length > 0 ? sorted[sorted.length - 1].depthZ : 0;

  return {
    sortedObjectIdsByDepth: Object.freeze(sortedObjectIdsByDepth),
    isStrictlyOrdered,
    depthRange: [minDepth, maxDepth] as const,
  };
}
