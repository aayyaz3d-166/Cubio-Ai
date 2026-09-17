/**
 * 3D Memory Studio — Funnel 56
 * Security Scene Adapter & F47 GREEN/RED Gate
 *
 * Strictly authorizes only GREEN research states to become scene objects.
 * RED records are 100% BLOCKED from entering the scene graph.
 */

import { DimensionalInformationState } from '../../funnel49/types';
import { StateSceneObject } from '../objects/stateSceneObject';
import { SimulationDimension } from '../../funnel52/types';

export interface SecurityGateReport {
  readonly admittedGreenCount: number;
  readonly blockedRedCount: number;
  readonly totalEvaluated: number;
}

export function filterAndCreateStateObjects(
  states: readonly DimensionalInformationState[],
  activeDimension: SimulationDimension = 3
): { objects: StateSceneObject[]; report: SecurityGateReport } {
  const admitted: StateSceneObject[] = [];
  let blockedCount = 0;

  for (const state of states) {
    if (state.classification === 'GREEN' && state.processingAllowed) {
      const coord = state.coordinatesByDimension[activeDimension] || state.coordinatesByDimension[3] || state.coordinatesByDimension[1];
      const pos: [number, number, number] =
        coord && coord.coordinateValues.length >= 3
          ? [
              Number(coord.coordinateValues[0].toFixed(2)),
              Number(coord.coordinateValues[1].toFixed(2)),
              Number(coord.coordinateValues[2].toFixed(2)),
            ]
          : [0, 0, 0];

      const stateObj = new StateSceneObject(state, pos);
      admitted.push(stateObj);
    } else {
      blockedCount++;
    }
  }

  return {
    objects: admitted,
    report: Object.freeze({
      admittedGreenCount: admitted.length,
      blockedRedCount: blockedCount,
      totalEvaluated: states.length,
    }),
  };
}
