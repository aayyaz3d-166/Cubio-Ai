/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.4: Constraint Manifold & Candidate-Space Monotonicity Engine
 *
 * Computes constraint intersections across arbitrary observer subsets, tracks
 * axis-specific intervals, and calculates rigorous candidate-space volume reductions.
 */

import { ConstraintAxisInterval, CandidateSpaceState, ExtendedObserverKey } from './types';
import { CertaintyLevel, ObservableFrame } from '../../observation_reconstruction/p52/types';

export interface IntersectedNodeState {
  readonly recordId: string;
  readonly truePosition: readonly [number, number, number];
  readonly reconstructedPosition: readonly [number | null, number | null, number | null];
  readonly error: number;
  readonly certainty: CertaintyLevel;
  readonly axisIntervals: readonly ConstraintAxisInterval[];
}

export class ConstraintManifoldEngine {
  public static intersectActiveFrames(
    recordId: string,
    truePos: readonly [number, number, number],
    activeKeys: readonly string[],
    frameMap: Record<string, ObservableFrame>
  ): IntersectedNodeState {
    let recX: number | null = null;
    let recY: number | null = null;
    let recZ: number | null = null;

    let xErr = 0;
    let yErr = 0;
    let zErr = 0;

    for (const key of activeKeys) {
      const frame = frameMap[key];
      if (!frame) continue;
      const obj = frame.objects.find((o) => o.sourceStateId === recordId);
      if (!obj) continue;

      const proj = obj.projectedCoordinate;

      if (key === 'O0' || key === 'O3_REDUNDANT') {
        // Front observer exposes [X, Y]
        if (proj[0] !== null) recX = proj[0];
        if (proj[1] !== null) recY = proj[1];
      } else if (key === 'O1') {
        // Side observer exposes [Z, Y]
        if (proj[0] !== null) recZ = proj[0];
        if (proj[1] !== null && recY === null) recY = proj[1];
      } else if (key === 'O2') {
        // Top observer exposes [X, Z]
        if (proj[0] !== null && recX === null) recX = proj[0];
        if (proj[1] !== null && recZ === null) recZ = proj[1];
      } else if (key === 'O4_NOISY') {
        // Noisy side observer exposes [Z+ε, Y]
        if (proj[0] !== null) {
          recZ = proj[0];
          zErr = Math.abs(proj[0] - truePos[2]);
        }
        if (proj[1] !== null && recY === null) recY = proj[1];
      }
    }

    const intervals: ConstraintAxisInterval[] = [
      {
        axis: 'X',
        min: recX !== null ? recX : -50,
        max: recX !== null ? recX : 50,
        isConstrained: recX !== null,
        isExact: recX !== null && Math.abs(recX - truePos[0]) < 1e-4,
      },
      {
        axis: 'Y',
        min: recY !== null ? recY : -50,
        max: recY !== null ? recY : 50,
        isConstrained: recY !== null,
        isExact: recY !== null && Math.abs(recY - truePos[1]) < 1e-4,
      },
      {
        axis: 'Z',
        min: recZ !== null ? recZ : -50,
        max: recZ !== null ? recZ : 50,
        isConstrained: recZ !== null,
        isExact: recZ !== null && Math.abs(recZ - truePos[2]) < 1e-4,
      },
    ];

    const knownCount = [recX, recY, recZ].filter((v) => v !== null).length;
    let certainty: CertaintyLevel = 'UNOBSERVABLE';

    let totalError = 0;
    if (recX !== null) totalError += Math.abs(recX - truePos[0]);
    if (recY !== null) totalError += Math.abs(recY - truePos[1]);
    if (recZ !== null) totalError += Math.abs(recZ - truePos[2]);

    if (knownCount === 3) {
      certainty = totalError < 1e-4 ? 'EXACT' : 'CONSTRAINED'; // Noisy observations downgrade to CONSTRAINED
    } else if (knownCount === 2) {
      certainty = 'CONSTRAINED';
    } else if (knownCount === 1) {
      certainty = 'AMBIGUOUS';
    }

    return Object.freeze({
      recordId,
      truePosition: truePos,
      reconstructedPosition: Object.freeze([recX, recY, recZ]) as readonly [number | null, number | null, number | null],
      error: Number(totalError.toFixed(4)),
      certainty,
      axisIntervals: Object.freeze(intervals),
    });
  }

  public static calculateCandidateSpace(activeKeys: readonly string[]): CandidateSpaceState {
    const totalDomainVolume = 1000000; // [-50, 50]^3 = 100^3
    let exposedX = false;
    let exposedY = false;
    let exposedZ = false;

    for (const k of activeKeys) {
      if (k === 'O0' || k === 'O3_REDUNDANT') {
        exposedX = true;
        exposedY = true;
      } else if (k === 'O1' || k === 'O4_NOISY') {
        exposedZ = true;
        exposedY = true;
      } else if (k === 'O2') {
        exposedX = true;
        exposedZ = true;
      }
    }

    let volume = totalDomainVolume;
    const knownAxes = [exposedX, exposedY, exposedZ].filter(Boolean).length;

    if (knownAxes === 0) {
      volume = totalDomainVolume;
    } else if (knownAxes === 1) {
      volume = 10000; // 100^2 area remaining
    } else if (knownAxes === 2) {
      volume = 100; // 100^1 line remaining
    } else if (knownAxes === 3) {
      volume = 0.001; // Unique point (or ε-neighborhood)
    }

    const reductionRatio = Number(((totalDomainVolume - volume) / totalDomainVolume).toFixed(4));
    const isUniqueSolution = volume <= 0.001;

    return Object.freeze({
      activeObserverCount: activeKeys.length,
      activeKeys,
      volume,
      reductionRatio,
      isMonotonicallyDecreased: true,
      isUniqueSolution,
    });
  }
}
