/**
 * 3D Memory Studio — Funnel 83
 * Frame Reversibility Experiment Engine (O0 -> O1 -> O0)
 */

import { FrameReversibilityReport, ObserverFrameConfig } from '../types';
import { FullState } from '../../f82/types';
import { FrameProjectionEngine } from '../projection/frameProjection';

export function testFrameReversibility(
  state: FullState,
  frame0: ObserverFrameConfig,
  frame1: ObserverFrameConfig,
  frame0Prime: ObserverFrameConfig,
  tolerance = 0.0001
): FrameReversibilityReport {
  const engine = new FrameProjectionEngine();

  const res0 = engine.projectFrame(state, frame0);
  const res1 = engine.projectFrame(state, frame1);
  const res0Prime = engine.projectFrame(state, frame0Prime);

  const hashMatch = res0.frame.frameHash === res0Prime.frame.frameHash;
  const repMatch = res0.representation.frameHash === res0Prime.representation.frameHash;

  let coordinateMatch = true;
  const count0 = res0.frame.visibleObjects.length;
  const countPrime = res0Prime.frame.visibleObjects.length;

  if (count0 !== countPrime) {
    coordinateMatch = false;
  } else {
    for (let i = 0; i < count0; i++) {
      const p0 = res0.frame.visibleObjects[i].position;
      const pP = res0Prime.frame.visibleObjects[i].position;
      const diff = Math.sqrt(
        Math.pow(p0[0] - pP[0], 2) +
        Math.pow(p0[1] - pP[1], 2) +
        Math.pow(p0[2] - pP[2], 2)
      );
      if (diff > tolerance) {
        coordinateMatch = false;
        break;
      }
    }
  }

  const isReversible = hashMatch && repMatch && coordinateMatch;

  return Object.freeze({
    experimentId: 'REV_EXP_' + state.stateId + '_' + frame0.frameId,
    stateId: state.stateId,
    frame0Id: frame0.frameId,
    frame1Id: frame1.frameId,
    frame0PrimeId: frame0Prime.frameId,
    hashF0: res0.frame.frameHash,
    hashF0Prime: res0Prime.frame.frameHash,
    isReversible,
    coordinateTolerance: tolerance,
  });
}
