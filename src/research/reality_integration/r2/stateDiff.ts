/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R2: Reality State Diff Engine
 *
 * Computes deterministic diffs between two Reality states.
 */

import {
  RealityState,
  RealityStateDiff,
  RealityCoordinateDiff,
  RealityDimensionDiff,
} from './types';

export class RealityStateDiffEngine {
  public static compareStates(stateA: RealityState, stateB: RealityState): RealityStateDiff {
    const xDiff: RealityCoordinateDiff = Object.freeze({
      before: stateA.coordinates[0],
      after: stateB.coordinates[0],
      changed: stateA.coordinates[0] !== stateB.coordinates[0],
    });

    const yDiff: RealityCoordinateDiff = Object.freeze({
      before: stateA.coordinates[1],
      after: stateB.coordinates[1],
      changed: stateA.coordinates[1] !== stateB.coordinates[1],
    });

    const zDiff: RealityCoordinateDiff = Object.freeze({
      before: stateA.coordinates[2],
      after: stateB.coordinates[2],
      changed: stateA.coordinates[2] !== stateB.coordinates[2],
    });

    const widthDiff: RealityDimensionDiff = Object.freeze({
      before: stateA.dimensions[0],
      after: stateB.dimensions[0],
      changed: stateA.dimensions[0] !== stateB.dimensions[0],
    });

    const heightDiff: RealityDimensionDiff = Object.freeze({
      before: stateA.dimensions[1],
      after: stateB.dimensions[1],
      changed: stateA.dimensions[1] !== stateB.dimensions[1],
    });

    const depthDiff: RealityDimensionDiff = Object.freeze({
      before: stateA.dimensions[2],
      after: stateB.dimensions[2],
      changed: stateA.dimensions[2] !== stateB.dimensions[2],
    });

    const certaintyChanged = stateA.certainty !== stateB.certainty;
    const originChanged = stateA.origin !== stateB.origin;
    const checksumChanged = stateA.checksum !== stateB.checksum;

    const isIdentical =
      !xDiff.changed &&
      !yDiff.changed &&
      !zDiff.changed &&
      !widthDiff.changed &&
      !heightDiff.changed &&
      !depthDiff.changed &&
      !certaintyChanged &&
      !originChanged &&
      !checksumChanged;

    return Object.freeze({
      stateAId: stateA.stateId,
      stateBId: stateB.stateId,
      coordinates: Object.freeze({
        x: xDiff,
        y: yDiff,
        z: zDiff,
      }),
      dimensions: Object.freeze({
        width: widthDiff,
        height: heightDiff,
        depth: depthDiff,
      }),
      certaintyChanged,
      certaintyBefore: stateA.certainty,
      certaintyAfter: stateB.certainty,
      originChanged,
      originBefore: stateA.origin,
      originAfter: stateB.origin,
      checksumChanged,
      isIdentical,
    });
  }
}
