/**
 * 3D Memory Studio — Phase 5: Observation & Reconstruction
 * Funnel P5.2: Controlled Ambiguity Resolution Experiment
 *
 * Demonstrates:
 * 1. Two states X_near (Z=6) and X_far (Z=30) project identically under Top-Down/Frontal Z2 Observer O0 (Ambiguity).
 * 2. Adding Side Observer O1 (which projects along Z) produces distinct projections F(X_near, O1) != F(X_far, O1).
 * 3. The combined observation {F0, F1} uniquely resolves the spatial ambiguity.
 */

import { AmbiguityExperimentResult } from './types';
import { createSpatialAmbiguityStates } from './experimentState';
import { createObserverO0, createObserverO1, projectStateToObserver } from './multiObserver';

export function runAmbiguityResolutionExperiment(): AmbiguityExperimentResult {
  const { stateNear, stateFar } = createSpatialAmbiguityStates();

  // Observers in Z2
  const observerO0 = createObserverO0(2); // Frontal/Top Z2 view: projects [X, Y]
  const observerO1 = createObserverO1(2); // Side Z2 view: projects [Z, Y]

  // Frame from O0 for both states
  const frameNearO0 = projectStateToObserver(stateNear, observerO0);
  const frameFarO0 = projectStateToObserver(stateFar, observerO0);

  // Frame from O1 for both states
  const frameNearO1 = projectStateToObserver(stateNear, observerO1);
  const frameFarO1 = projectStateToObserver(stateFar, observerO1);

  // Single observer O0 comparison (X, Y identical, Z differs)
  const singleIdentical = frameNearO0.frameChecksum === frameFarO0.frameChecksum;
  const singleAmbiguity = singleIdentical; // States differ, but frames are identical

  // Multi observer O1 comparison
  const multiIdentical = frameNearO1.frameChecksum === frameFarO1.frameChecksum;
  const wasResolved = singleAmbiguity && !multiIdentical;

  return Object.freeze({
    caseId: 'EXP_P52_SPATIAL_AMBIGUITY_RESOLVED',
    description: 'Resolving Z-depth collapse ambiguity via orthogonal multi-observer intersection',
    stateAId: stateNear.stateId,
    stateBId: stateFar.stateId,
    singleObserverAmbiguity: singleAmbiguity,
    multiObserverAmbiguity: !wasResolved,
    wasAmbiguityResolved: wasResolved,
    singleObserverFrameIdentical: singleIdentical,
    multiObserverFrameIdentical: multiIdentical,
    remainingAmbiguityDegree: wasResolved ? 'NONE' : 'PERSISTENT',
  });
}
