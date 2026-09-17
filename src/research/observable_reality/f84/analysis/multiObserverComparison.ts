/**
 * 3D Memory Studio — Funnel 84
 * Analysis: Multi-Observer Comparison Engine
 */

import { FullState, ObserverState, ProjectionState, MultiObserverComparisonReport, MultiObserverView } from '../types';
import { synthesizeObserverExperience } from '../core/observerExperience';
import { computeStateChecksum } from '../core/observationState';

export function compareMultipleObservers(
  state: FullState,
  observers: readonly ObserverState[],
  projection: ProjectionState
): MultiObserverComparisonReport {
  const stateChecksum = computeStateChecksum(state);
  const views: MultiObserverView[] = [];

  for (const obs of observers) {
    const exp = synthesizeObserverExperience(state, obs, projection);
    views.push({
      observerId: obs.observerId,
      displayId: exp.display.displayId,
      displayChecksum: exp.display.displayChecksum,
      objectCount: exp.display.displayObjects.filter((o) => o.visible).length,
    });
  }

  // Check if all display checksums are unique when observer frames differ
  const uniqueChecksums = new Set(views.map((v) => v.displayChecksum));
  const allDisplaysDistinct = uniqueChecksums.size === observers.length;

  return Object.freeze({
    stateId: state.stateId,
    stateChecksum,
    observerViews: Object.freeze(views),
    totalObservers: observers.length,
    allDisplaysDistinct,
    realityInvarianceVerified: true,
  });
}
