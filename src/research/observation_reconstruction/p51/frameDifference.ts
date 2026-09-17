/**
 * 3D Memory Studio — Phase 5: Observation & Reconstruction
 * P5.1: Frame Difference Computation
 *
 * Compares two observable frames to determine whether they are identical
 * or differ in their projected screen representations.
 */

import { P51ObservableFrame, P51FrameDifference, P51ScreenDelta } from './types';

export function compareFrames(
  frameA: P51ObservableFrame,
  frameB: P51ObservableFrame
): P51FrameDifference {
  const deltas: P51ScreenDelta[] = [];
  let visibilityMismatches = 0;

  for (const objA of frameA.objects) {
    const objB = frameB.objects.find((o) => o.sourceStateId === objA.sourceStateId);
    if (!objB) continue;

    const dx = objA.screenCoordinate[0] - objB.screenCoordinate[0];
    const dy = objA.screenCoordinate[1] - objB.screenCoordinate[1];
    const mag = Math.sqrt(dx * dx + dy * dy);

    deltas.push({
      objectId: objA.sourceStateId,
      deltaX: Number(dx.toFixed(4)),
      deltaY: Number(dy.toFixed(4)),
      deltaMagnitude: Number(mag.toFixed(4)),
    });

    if (objA.visible !== objB.visible) {
      visibilityMismatches++;
    }
  }

  const avgDisparity = deltas.length > 0
    ? Number((deltas.reduce((s, d) => s + d.deltaMagnitude, 0) / deltas.length).toFixed(4))
    : 0;
  const maxDisparity = deltas.length > 0
    ? Number(Math.max(...deltas.map((d) => d.deltaMagnitude)).toFixed(4))
    : 0;

  const isIdentical =
    frameA.frameChecksum === frameB.frameChecksum &&
    maxDisparity === 0 &&
    visibilityMismatches === 0;

  return Object.freeze({
    frameAId: frameA.frameId,
    frameBId: frameB.frameId,
    isIdentical,
    screenDeltas: Object.freeze(deltas),
    averageDisparity: avgDisparity,
    maxDisparity,
    visibilityMismatchCount: visibilityMismatches,
  });
}
