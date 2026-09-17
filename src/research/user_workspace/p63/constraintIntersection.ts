/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.3: Multi-Observer Constraint Intersection Engine
 *
 * Implements deterministic intersection of observable coordinate projections:
 * F0: [X, Y] (Z is unobserved)
 * F1: [Z, Y] (X is unobserved)
 * F2: [X, Z] (Y is unobserved)
 *
 * Intersecting any complementary pair recovers full 3D coordinates [X, Y, Z].
 */

import { ObserverCombinationKey, CandidateSpaceState } from './types';
import { CertaintyLevel } from '../../observation_reconstruction/p52/types';

export class ConstraintIntersectionEngine {
  public static intersectCoordinateProjections(
    combinationKey: ObserverCombinationKey,
    f0Coord?: readonly [number | null, number | null, number | null],
    f1Coord?: readonly [number | null, number | null, number | null],
    f2Coord?: readonly [number | null, number | null, number | null]
  ): {
    reconstructedPosition: readonly [number | null, number | null, number | null];
    certainty: CertaintyLevel;
  } {
    let recX: number | null = null;
    let recY: number | null = null;
    let recZ: number | null = null;

    if (combinationKey === 'F0') {
      if (f0Coord) {
        recX = f0Coord[0];
        recY = f0Coord[1];
      }
    } else if (combinationKey === 'F1') {
      if (f1Coord) {
        recZ = f1Coord[0];
        recY = f1Coord[1];
      }
    } else if (combinationKey === 'F2') {
      if (f2Coord) {
        recX = f2Coord[0];
        recZ = f2Coord[1];
      }
    } else if (combinationKey === 'F0+F1') {
      if (f0Coord) {
        recX = f0Coord[0];
        recY = f0Coord[1];
      }
      if (f1Coord) {
        recZ = f1Coord[0];
        if (recY === null) recY = f1Coord[1];
      }
    } else if (combinationKey === 'F0+F2') {
      if (f0Coord) {
        recX = f0Coord[0];
        recY = f0Coord[1];
      }
      if (f2Coord) {
        recZ = f2Coord[1];
        if (recX === null) recX = f2Coord[0];
      }
    } else if (combinationKey === 'F1+F2') {
      if (f1Coord) {
        recZ = f1Coord[0];
        recY = f1Coord[1];
      }
      if (f2Coord) {
        recX = f2Coord[0];
        if (recZ === null) recZ = f2Coord[1];
      }
    } else if (combinationKey === 'F0+F1+F2') {
      if (f0Coord) {
        recX = f0Coord[0];
        recY = f0Coord[1];
      }
      if (f1Coord) {
        recZ = f1Coord[0];
        if (recY === null) recY = f1Coord[1];
      }
      if (f2Coord) {
        if (recX === null) recX = f2Coord[0];
        if (recZ === null) recZ = f2Coord[1];
      }
    }

    const reconstructed: [number | null, number | null, number | null] = [recX, recY, recZ];
    const known = reconstructed.filter((v) => v !== null).length;

    let certainty: CertaintyLevel = 'UNOBSERVABLE';
    if (known === 3) certainty = 'EXACT';
    else if (known === 2) certainty = 'CONSTRAINED';
    else if (known === 1) certainty = 'AMBIGUOUS';

    return {
      reconstructedPosition: Object.freeze(reconstructed),
      certainty,
    };
  }

  public static calculateCandidateSpace(combinationKey: ObserverCombinationKey): CandidateSpaceState {
    const initialVolume = 1000000; // [-50, 50] bounds in 3D: 100^3
    let volume = initialVolume;
    let reductionRatio = 0.0;
    let isUniqueSolution = false;

    if (['F0', 'F1', 'F2'].includes(combinationKey)) {
      // 1 observer fixes 2 dimensions -> 1D line ambiguity remains (length 100)
      volume = 100.0;
      reductionRatio = 0.9999;
      isUniqueSolution = false;
    } else if (['F0+F1', 'F0+F2', 'F1+F2'].includes(combinationKey)) {
      // 2 orthogonal observers intersect line constraints -> unique point
      volume = 0.001;
      reductionRatio = 1.0;
      isUniqueSolution = true;
    } else if (combinationKey === 'F0+F1+F2') {
      // 3 observers over-constrain the solution space -> unique point + cross-validation
      volume = 0.001;
      reductionRatio = 1.0;
      isUniqueSolution = true;
    }

    return Object.freeze({
      combinationKey,
      volume,
      reductionRatio,
      isUniqueSolution,
    });
  }
}
