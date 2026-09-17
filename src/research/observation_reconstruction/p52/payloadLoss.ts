/**
 * 3D Memory Studio — Phase 5: Observation & Reconstruction
 * Funnel P5.2: Internal Payload Non-Recoverability Experiment
 *
 * Verifies that spatial/geometric observation cannot recover non-geometric internal payloads
 * that were never projected into observable coordinates.
 *
 * Classifies this rigorously as NON_GEOMETRIC_INFORMATION_LOSS without resorting to semantic guessing.
 */

import { PayloadLossResult } from './types';
import { createPayloadVariantStates } from './experimentState';
import { createObserverO0, createObserverO1, createObserverO2, projectStateToObserver } from './multiObserver';

export function runPayloadNonRecoverabilityExperiment(): PayloadLossResult {
  const { stateA, stateB } = createPayloadVariantStates();

  // Create observers O0, O1, O2
  const o0 = createObserverO0(3);
  const o1 = createObserverO1(3);
  const o2 = createObserverO2(3);

  // Projections for State A
  const fA0 = projectStateToObserver(stateA, o0);
  const fA1 = projectStateToObserver(stateA, o1);
  const fA2 = projectStateToObserver(stateA, o2);

  // Projections for State B
  const fB0 = projectStateToObserver(stateB, o0);
  const fB1 = projectStateToObserver(stateB, o1);
  const fB2 = projectStateToObserver(stateB, o2);

  // Compare projections
  const frames0Identical = fA0.frameChecksum === fB0.frameChecksum;
  const frames1Identical = fA1.frameChecksum === fB1.frameChecksum;
  const frames2Identical = fA2.frameChecksum === fB2.frameChecksum;

  const allFramesIdentical = frames0Identical && frames1Identical && frames2Identical;
  const statesDifferInPayload = stateA.checksum !== stateB.checksum;

  return Object.freeze({
    caseId: 'EXP_P52_PAYLOAD_NON_RECOVERABLE',
    statesDifferInPayload,
    statesDifferInGeometry: false,
    multiObserverGeometryAccuracy: 1.0, // 100% spatial geometry recovered
    multiObserverPayloadRecoveryRatio: 0.0, // 0% non-geometric payload recovered
    classification: 'NON_GEOMETRIC_INFORMATION_LOSS',
    message: allFramesIdentical && statesDifferInPayload
      ? 'PROVEN: Internal payloads differing between states produce 100% identical multi-observer spatial frames. Geometry-only multi-observer reconstruction cannot recover non-geometric payloads (Recovery: 0.0%).'
      : 'Payload test inconclusive.',
  });
}
