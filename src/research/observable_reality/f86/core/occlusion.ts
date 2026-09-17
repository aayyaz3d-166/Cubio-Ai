/**
 * 3D Memory Studio — Funnel 86
 * Core: Screen-Space Occlusion & Depth Ordering Model
 */

import { F86VisibilityReason } from '../types';

export interface F86OcclusionResult {
  readonly occluded: boolean;
  readonly occludedBy: string | null;
  readonly depthRank: number;
  readonly visibleFraction: number;
  readonly occludedFraction: number;
  readonly reason: F86VisibilityReason;
}

export function evaluateScreenOcclusion(
  targetId: string,
  targetScreen: readonly [number, number],
  targetRadius: number,
  targetDepth: number,
  allCandidates: readonly {
    id: string;
    screenPos: readonly [number, number];
    radius: number;
    depth: number;
    inFrustum: boolean;
  }[]
): F86OcclusionResult {
  // Sort all candidates by depth (nearest to observer first)
  const validCandidates = allCandidates
    .filter((c) => c.inFrustum)
    .sort((a, b) => a.depth - b.depth);

  const depthRank = validCandidates.findIndex((c) => c.id === targetId) + 1;

  let maxOverlapFraction = 0;
  let primaryOccluder: string | null = null;

  for (const other of validCandidates) {
    if (other.id === targetId) break; // Only nearer objects can occlude

    const dx = targetScreen[0] - other.screenPos[0];
    const dy = targetScreen[1] - other.screenPos[1];
    const centerDist = Math.hypot(dx, dy);

    // If other completely covers target
    if (centerDist + targetRadius <= other.radius + 1) {
      maxOverlapFraction = 1.0;
      primaryOccluder = other.id;
      break;
    }

    // Partial overlap of circles
    if (centerDist < targetRadius + other.radius) {
      const overlapDist = (targetRadius + other.radius) - centerDist;
      const overlapFraction = Math.min(1.0, overlapDist / (2 * targetRadius));
      if (overlapFraction > maxOverlapFraction) {
        maxOverlapFraction = Number(overlapFraction.toFixed(4));
        primaryOccluder = other.id;
      }
    }
  }

  const isFullyOccluded = maxOverlapFraction >= 0.85;
  const isPartiallyOccluded = maxOverlapFraction > 0.15 && !isFullyOccluded;

  let reason: F86VisibilityReason = 'VISIBLE';
  if (isFullyOccluded) {
    reason = 'OCCLUDED';
  } else if (isPartiallyOccluded) {
    reason = 'PARTIALLY_OCCLUDED';
  }

  return {
    occluded: isFullyOccluded,
    occludedBy: primaryOccluder,
    depthRank: Math.max(1, depthRank),
    visibleFraction: Number((1.0 - maxOverlapFraction).toFixed(4)),
    occludedFraction: maxOverlapFraction,
    reason,
  };
}
