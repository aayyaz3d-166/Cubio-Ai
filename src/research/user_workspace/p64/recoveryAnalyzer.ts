/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.4: Recovery Analyzer & Saturation Engine
 *
 * Evaluates recovery progression across single, dual, triple, redundant, and noisy observer subsets.
 */

import { WorkspaceReality, WorkspaceObserver } from '../p61/types';
import {
  ObserverFusionConfig,
  FusionResult,
  PropertyInformationBoundary,
} from './types';
import { ObserverFusionEngine } from './observerFusion';
import { ConstraintManifoldEngine } from './constraintManifold';
import { InformationBoundaryEngine } from './informationBoundary';
import { generateDeterministicFusionId } from './determinism';

export class RecoveryAnalyzer {
  public static analyzeFusion(
    reality: WorkspaceReality,
    observers: Record<string, WorkspaceObserver>,
    config: ObserverFusionConfig,
    stepIndex = 1
  ): FusionResult {
    const frameMap = ObserverFusionEngine.projectAllActiveFrames(reality, observers, config);
    const activeKeys = config.enabledKeys;

    const allBoundaries: PropertyInformationBoundary[] = [];
    const reconstructedCoords: Array<{
      recordId: string;
      truePosition: readonly [number, number, number];
      reconstructedPosition: readonly [number | null, number | null, number | null];
      error: number;
      certainty: any;
      axisIntervals: any;
    }> = [];

    let totalSpatialKnown = 0;
    const totalSpatialTarget = reality.objects.length * 3;

    for (const obj of reality.objects) {
      const nodeState = ConstraintManifoldEngine.intersectActiveFrames(
        obj.id,
        obj.position,
        activeKeys,
        frameMap
      );

      reconstructedCoords.push({
        recordId: obj.id,
        truePosition: obj.position,
        reconstructedPosition: nodeState.reconstructedPosition,
        error: nodeState.error,
        certainty: nodeState.certainty,
        axisIntervals: nodeState.axisIntervals,
      });

      const recPos = nodeState.reconstructedPosition;
      if (recPos[0] !== null) totalSpatialKnown++;
      if (recPos[1] !== null) totalSpatialKnown++;
      if (recPos[2] !== null) totalSpatialKnown++;

      const boundaries = InformationBoundaryEngine.classifyProperties(obj, nodeState);
      allBoundaries.push(...boundaries);
    }

    const candidateSpace = ConstraintManifoldEngine.calculateCandidateSpace(activeKeys);
    const geometricAccuracy = totalSpatialTarget > 0 ? Number((totalSpatialKnown / totalSpatialTarget).toFixed(4)) : 1.0;
    const geometricInformationLoss = Number(((1.0 - geometricAccuracy) * 100).toFixed(1));
    const geometricInformationGain = Number((100.0 - geometricInformationLoss).toFixed(1));

    // Redundancy analysis: does this set contain redundant views without adding new spatial axes?
    const hasRedundant = activeKeys.includes('O3_REDUNDANT');
    const redundancyGain = hasRedundant && activeKeys.includes('O0') ? 0.0 : 0.0;
    const isSaturated = geometricAccuracy === 1.0;

    return Object.freeze({
      fusionId: generateDeterministicFusionId(stepIndex, activeKeys.length),
      activeObserverKeys: Object.freeze([...activeKeys]),
      totalObjects: reality.objects.length,
      reconstructedCoordinates: Object.freeze(reconstructedCoords),
      geometricAccuracy,
      geometricInformationLoss,
      geometricInformationGain,
      candidateSpace,
      informationBoundaries: Object.freeze(allBoundaries),
      payloadRecoveryRatio: 0.0, // Payload always 0.0% recoverable
      isSaturated,
      redundancyGain,
    });
  }
}
