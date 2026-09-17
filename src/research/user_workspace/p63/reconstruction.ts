/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.3: Multi-Observer Reconstruction Builder
 *
 * Combines observable frames from O0, O1, and O2 to produce comprehensive reconstruction metrics.
 */

import { WorkspaceReality } from '../p61/types';
import {
  ObserverCombinationKey,
  ObserverKey,
  P63ObservableFrameSet,
  P63ReconstructionResult,
} from './types';
import { ConstraintIntersectionEngine } from './constraintIntersection';
import { PropertyRecoveryStatus } from '../../observation_reconstruction/p52/types';

export class MultiObserverReconstructionBuilder {
  public static buildReconstruction(
    reality: WorkspaceReality,
    frames: P63ObservableFrameSet,
    combinationKey: ObserverCombinationKey
  ): P63ReconstructionResult {
    let activeObserverKeys: ObserverKey[] = ['O0'];
    if (combinationKey === 'F1') activeObserverKeys = ['O1'];
    else if (combinationKey === 'F2') activeObserverKeys = ['O2'];
    else if (combinationKey === 'F0+F1') activeObserverKeys = ['O0', 'O1'];
    else if (combinationKey === 'F0+F2') activeObserverKeys = ['O0', 'O2'];
    else if (combinationKey === 'F1+F2') activeObserverKeys = ['O1', 'O2'];
    else if (combinationKey === 'F0+F1+F2') activeObserverKeys = ['O0', 'O1', 'O2'];

    const propertyStatuses: PropertyRecoveryStatus[] = [];
    const reconstructedCoords: Array<{
      recordId: string;
      truePosition: readonly [number, number, number];
      reconstructedPosition: readonly [number | null, number | null, number | null];
      error: number;
      certainty: any;
    }> = [];

    let totalSpatialKnown = 0;
    const totalSpatialTarget = reality.objects.length * 3;

    for (const obj of reality.objects) {
      const f0Obj = frames.F0.objects.find((o) => o.sourceStateId === obj.id);
      const f1Obj = frames.F1.objects.find((o) => o.sourceStateId === obj.id);
      const f2Obj = frames.F2.objects.find((o) => o.sourceStateId === obj.id);

      const intersection = ConstraintIntersectionEngine.intersectCoordinateProjections(
        combinationKey,
        f0Obj?.projectedCoordinate,
        f1Obj?.projectedCoordinate,
        f2Obj?.projectedCoordinate
      );

      let err = 0;
      const recPos = intersection.reconstructedPosition;
      if (recPos[0] !== null) { err += Math.abs(recPos[0] - obj.position[0]); totalSpatialKnown++; }
      if (recPos[1] !== null) { err += Math.abs(recPos[1] - obj.position[1]); totalSpatialKnown++; }
      if (recPos[2] !== null) { err += Math.abs(recPos[2] - obj.position[2]); totalSpatialKnown++; }

      reconstructedCoords.push({
        recordId: obj.id,
        truePosition: obj.position,
        reconstructedPosition: recPos,
        error: Number(err.toFixed(4)),
        certainty: intersection.certainty,
      });

      propertyStatuses.push({
        propertyName: 'position.x',
        recordId: obj.id,
        category: 'POSITIONAL',
        trueValue: obj.position[0],
        recoveredValue: recPos[0],
        certainty: recPos[0] !== null ? 'EXACT' : 'UNOBSERVABLE',
        errorMagnitude: recPos[0] !== null ? Math.abs(recPos[0] - obj.position[0]) : 50,
      });

      propertyStatuses.push({
        propertyName: 'position.y',
        recordId: obj.id,
        category: 'POSITIONAL',
        trueValue: obj.position[1],
        recoveredValue: recPos[1],
        certainty: recPos[1] !== null ? 'EXACT' : 'UNOBSERVABLE',
        errorMagnitude: recPos[1] !== null ? Math.abs(recPos[1] - obj.position[1]) : 50,
      });

      propertyStatuses.push({
        propertyName: 'position.z',
        recordId: obj.id,
        category: 'POSITIONAL',
        trueValue: obj.position[2],
        recoveredValue: recPos[2],
        certainty: recPos[2] !== null ? 'EXACT' : 'UNOBSERVABLE',
        errorMagnitude: recPos[2] !== null ? Math.abs(recPos[2] - obj.position[2]) : 50,
      });

      if (obj.internalPayload) {
        propertyStatuses.push({
          propertyName: 'internalPayload',
          recordId: obj.id,
          category: 'INTERNAL_PAYLOAD',
          trueValue: obj.internalPayload,
          recoveredValue: null,
          certainty: 'UNOBSERVABLE',
          errorMagnitude: 1.0,
        });
      }
    }

    const accuracyScore = totalSpatialTarget > 0 ? Number((totalSpatialKnown / totalSpatialTarget).toFixed(4)) : 1.0;
    const informationLoss = Number(((1.0 - accuracyScore) * 100).toFixed(1));
    const informationGain = Number((100.0 - informationLoss).toFixed(1));
    const isExact = accuracyScore === 1.0;
    const candidateSpace = ConstraintIntersectionEngine.calculateCandidateSpace(combinationKey);

    let certainty: any = 'UNOBSERVABLE';
    if (isExact) certainty = 'EXACT';
    else if (accuracyScore >= 0.66) certainty = 'CONSTRAINED';
    else if (accuracyScore >= 0.33) certainty = 'AMBIGUOUS';

    return Object.freeze({
      combinationKey,
      activeObserverKeys: Object.freeze(activeObserverKeys),
      totalObjects: reality.objects.length,
      reconstructedCoordinates: Object.freeze(reconstructedCoords),
      accuracyScore,
      informationLoss,
      informationGain,
      certainty,
      isExact,
      candidateSpace,
      propertyStatuses: Object.freeze(propertyStatuses),
    });
  }
}
