/**
 * 3D Memory Studio — Phase 5: Observation & Reconstruction
 * Funnel P5.2: Uncertainty Model & Candidate Space Intersection
 *
 * Implements mathematical uncertainty bounds for structural and spatial properties:
 * - EXACT: 0 uncertainty, single candidate point
 * - CONSTRAINED: bounded interval / plane (candidate volume < infinity)
 * - AMBIGUOUS: discrete multi-point candidates
 * - UNOBSERVABLE: unconstrained / non-geometric payload
 */

import { CertaintyLevel, SimulationDimension } from './types';

export interface BoundedInterval {
  readonly min: number;
  readonly max: number;
  readonly isKnown: boolean;
}

export function intersectIntervals(a: BoundedInterval, b: BoundedInterval): BoundedInterval {
  if (!a.isKnown) return b;
  if (!b.isKnown) return a;

  const min = Math.max(a.min, b.min);
  const max = Math.min(a.max, b.max);
  if (min > max) {
    // Inconsistent constraint fallback to narrowest
    return { min: (a.min + b.min) / 2, max: (a.max + b.max) / 2, isKnown: true };
  }
  return { min, max, isKnown: true };
}

export function evaluateCoordinateCertainty(
  coord: readonly [number | null, number | null, number | null]
): CertaintyLevel {
  const knownCount = coord.filter((c) => c !== null).length;
  if (knownCount === 3) return 'EXACT';
  if (knownCount === 2) return 'CONSTRAINED';
  if (knownCount === 1) return 'AMBIGUOUS';
  return 'UNOBSERVABLE';
}

export function calculateCandidateVolume(
  dim: SimulationDimension,
  observerCount: number,
  observedDimensionsPerFrame: number
): { initialVolume: number; remainingVolume: number; reductionRatio: number } {
  // Bounded spatial search space: [-50, 50] in X, Y, Z -> initial volume = 100^3 = 1,000,000
  const initialVolume = 1000000;

  if (dim === 3) {
    // 3D single observer resolves full 3D geometry
    return {
      initialVolume,
      remainingVolume: 0.001,
      reductionRatio: 1.0,
    };
  }

  if (dim === 2) {
    // In Z2:
    // 1 observer fixes 2 dimensions (X, Y) -> 1D line remains (length 100) -> volume = 100
    // 2 observers (e.g. O0 [X,Y] + O1 [Z,Y]) fixes all 3 dimensions (X, Y, Z) -> volume ~ 0.001
    if (observerCount === 1) {
      return {
        initialVolume,
        remainingVolume: 100,
        reductionRatio: 0.9999,
      };
    } else {
      return {
        initialVolume,
        remainingVolume: 0.001,
        reductionRatio: 1.0,
      };
    }
  }

  // In Z1:
  // 1 observer fixes 1 dimension (X) -> 2D plane remains (100 * 100 = 10,000)
  // 2 observers (O0 [X] + O1 [Z]) fixes 2 dimensions -> 1D line remains (100)
  // 3 observers (O0 [X] + O1 [Z] + O2 [Y]) fixes all 3 dimensions -> 0.001
  if (observerCount === 1) {
    return {
      initialVolume,
      remainingVolume: 10000,
      reductionRatio: 0.99,
    };
  } else if (observerCount === 2) {
    return {
      initialVolume,
      remainingVolume: 100,
      reductionRatio: 0.9999,
    };
  } else {
    return {
      initialVolume,
      remainingVolume: 0.001,
      reductionRatio: 1.0,
    };
  }
}
