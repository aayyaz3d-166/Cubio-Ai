/**
 * 3D Memory Studio — Funnel 84
 * Analysis: Projection Reversibility & Determinism Tester (O0 → O1 → O2 → O0)
 */

import { FullState, ObserverState, ProjectionState, ProjectionReversibilityReport } from '../types';
import { synthesizeObserverExperience } from '../core/observerExperience';
import { computeObserverChecksum } from '../core/observationState';
import { ObserverController } from '../observer/observerController';

export function testProjectionReversibility(
  state: FullState,
  initialObserver: ObserverState,
  projection: ProjectionState
): ProjectionReversibilityReport {
  const controller = new ObserverController(initialObserver);

  // Initial Step 0: O0
  const exp0 = synthesizeObserverExperience(state, controller.getObserver(), projection);
  const initialObsChecksum = computeObserverChecksum(controller.getObserver());
  const initialDisplayChecksum = exp0.display.displayChecksum;

  // Intermediate Step 1: O1 (translated & rotated)
  controller.translate(20, 15, -10);
  controller.rotate(45, 20);
  controller.zoom(1.5);
  const exp1 = synthesizeObserverExperience(state, controller.getObserver(), projection);
  const intermediateObsChecksum = computeObserverChecksum(controller.getObserver());

  // Intermediate Step 2: O2 (further transformed)
  controller.translate(-50, 30, 25);
  controller.rotate(-30, 10);
  const exp2 = synthesizeObserverExperience(state, controller.getObserver(), projection);

  // Restored Step 3: O0' (reset to baseline)
  controller.reset(initialObserver);
  const exp0Prime = synthesizeObserverExperience(state, controller.getObserver(), projection);
  const restoredObsChecksum = computeObserverChecksum(controller.getObserver());
  const restoredDisplayChecksum = exp0Prime.display.displayChecksum;

  // Calculate coordinate variance across all display objects
  let totalDeltaSq = 0;
  let objectCount = 0;
  for (const obj0 of exp0.display.displayObjects) {
    const obj0Prime = exp0Prime.display.displayObjects.find((o) => o.sourceObjectId === obj0.sourceObjectId);
    if (obj0Prime) {
      const dx = obj0.screenCoordinates[0] - obj0Prime.screenCoordinates[0];
      const dy = obj0.screenCoordinates[1] - obj0Prime.screenCoordinates[1];
      totalDeltaSq += dx * dx + dy * dy;
      objectCount++;
    }
  }

  const coordinateVariance = objectCount > 0 ? Number((totalDeltaSq / objectCount).toFixed(6)) : 0;
  const isReversible =
    initialObsChecksum === restoredObsChecksum &&
    initialDisplayChecksum === restoredDisplayChecksum &&
    coordinateVariance === 0;

  return Object.freeze({
    experimentId: `REV_${Date.now()}`,
    stateId: state.stateId,
    initialObserverChecksum: initialObsChecksum,
    intermediateObserverChecksum: intermediateObsChecksum,
    restoredObserverChecksum: restoredObsChecksum,
    initialDisplayChecksum,
    restoredDisplayChecksum,
    isReversible,
    coordinateVariance,
  });
}
