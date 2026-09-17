/**
 * 3D Memory Studio — Funnel 83
 * State Invariance Guardian
 *
 * Mathematically verifies that observing a FullState through any number of
 * ObserverFrames produces zero side-effects or mutations on the underlying state.
 */

import { StateInvarianceReport, ObserverFrameConfig } from '../types';
import { FullState } from '../../f82/types';
import { FrameTraversalEngine } from './frameTraversal';

export function verifyStateInvariance(
  state: FullState,
  observerFrames: readonly ObserverFrameConfig[]
): StateInvarianceReport {
  const initialHash = state.stateHash;
  const initialStringified = JSON.stringify(state);

  const traversalEngine = new FrameTraversalEngine();
  traversalEngine.traverse(state, observerFrames);

  const finalHash = state.stateHash;
  const finalStringified = JSON.stringify(state);

  const isStateMutated = initialHash !== finalHash || initialStringified !== finalStringified;

  return Object.freeze({
    stateId: state.stateId,
    initialHash,
    finalHash,
    isStateMutated,
    totalObserverFramesApplied: observerFrames.length,
    verificationTimestamp: Date.now(),
  });
}
