/**
 * 3D Memory Studio — Funnel 88
 * Core: Inverse Reconstruction State & Evaluation
 */

import { F88DisplayState, F88ReconstructionResult, F88SpatialState } from '../types';

export function attemptInverseReconstruction(
  display: F88DisplayState,
  groundTruthState: F88SpatialState
): F88ReconstructionResult {
  const reconstructedPositions: Record<string, readonly number[]> = {};
  const ambiguityReasons: string[] = [];

  const centerX = display.width / 2;
  const centerY = display.height / 2;

  let exactMatches = 0;

  for (const obj of groundTruthState.objects) {
    const rec = display.objectRecords.find((r) => r.id === obj.id);

    if (!rec || !rec.visibleInDisplay) {
      ambiguityReasons.push(`${obj.id}: Hidden from display (Occluded or Outside FOV)`);
      // Cannot reconstruct hidden state
      reconstructedPositions[obj.id] = [0, 0, 0];
      continue;
    }

    // Attempt inverse from 2D screen coordinates back to 3D world coordinates
    const sx = rec.screenPosition[0];
    const sy = rec.screenPosition[1];

    const rxEstimated = (sx - centerX) / 12;
    const ryEstimated = (centerY - sy) / 12;

    // In orthographic or perspective projection without stereo cues, depth Z cannot be uniquely recovered from 2D alone!
    if (display.projectionType.includes('ORTHOGRAPHIC')) {
      // Orthographic has zero depth information in (sx, sy)
      reconstructedPositions[obj.id] = [
        Number(rxEstimated.toFixed(2)),
        Number(ryEstimated.toFixed(2)),
        0, // Assumed default depth
      ];
      if (Math.abs(obj.experimentalWorldPosition[2] - 0) > 0.1) {
        ambiguityReasons.push(`${obj.id}: Depth Z is lost in orthographic projection`);
      } else {
        exactMatches++;
      }
    } else {
      // Perspective projection has apparent scale, but size/distance ambiguity persists without known intrinsic size
      reconstructedPositions[obj.id] = [
        Number(rxEstimated.toFixed(2)),
        Number(ryEstimated.toFixed(2)),
        Number(rec.depthZ.toFixed(2)),
      ];
      const dx = Math.abs(obj.experimentalWorldPosition[0] - rxEstimated);
      const dy = Math.abs(obj.experimentalWorldPosition[1] - ryEstimated);
      if (dx < 0.5 && dy < 0.5) {
        exactMatches++;
      }
    }
  }

  const confidenceScore = Number((exactMatches / groundTruthState.objects.length).toFixed(2));
  const isExactReconstruction = exactMatches === groundTruthState.objects.length && ambiguityReasons.length === 0;

  return {
    attemptedStateId: groundTruthState.stateId,
    isExactReconstruction,
    reconstructedPositions: Object.freeze(reconstructedPositions),
    confidenceScore,
    ambiguityReasons: Object.freeze(ambiguityReasons),
  };
}
