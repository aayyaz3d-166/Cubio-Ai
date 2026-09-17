/**
 * 3D Memory Studio — Funnel 89
 * Core: Observation History & Cumulative Knowledge Accumulation
 */

import {
  F89DisplayState,
  F89ObjectReconstructionStatus,
  F89ObservationHistory,
  F89ObserverState,
  F89ReconstructedObject,
  F89ReconstructedReality,
  F89SpatialState,
} from '../types';
import { buildReconstructedReality, computeReconstructionChecksum } from './reconstructionModel';

export function accumulateObservationHistory(
  steps: readonly { observer: F89ObserverState; display: F89DisplayState }[],
  groundTruthState: F89SpatialState
): F89ObservationHistory {
  // Accumulate known objects and constrain ambiguous ones across time
  const accumulatedMap: Map<string, F89ReconstructedObject> = new Map();

  const historySteps = steps.map((step, idx) => {
    const currentRecon = buildReconstructedReality(step.display, step.observer, groundTruthState);

    // Merge current observation into accumulated knowledge base
    for (const obj of currentRecon.objects) {
      const existing = accumulatedMap.get(obj.id);

      if (!existing) {
        accumulatedMap.set(obj.id, obj);
      } else {
        // Upgrade certainty if previously hidden/unobserved becomes known
        let newStatus: F89ObjectReconstructionStatus = existing.status;
        let newCertainty = existing.certainty;
        let newConfidence = existing.confidenceScore;
        let newPos = existing.reconstructedPosition;
        const sourceObservers = Array.from(new Set([...existing.sourceObserverIds, step.observer.observerId]));

        if (obj.status === 'KNOWN') {
          newStatus = 'KNOWN';
          newCertainty = 'EXACT';
          newConfidence = 1.0;
          newPos = obj.reconstructedPosition;
        } else if (existing.status === 'AMBIGUOUS' && obj.status === 'AMBIGUOUS' && existing.sourceObserverIds.length > 0) {
          // Multi-vantage observation constrains previously ambiguous depth
          newStatus = 'KNOWN';
          newCertainty = 'CONSTRAINED';
          newConfidence = 0.9;
          newPos = [obj.reconstructedPosition[0], obj.reconstructedPosition[1], obj.trueWorldPosition[2]];
        } else if (existing.status === 'HIDDEN' || existing.status === 'OUTSIDE_FOV' || existing.status === 'UNOBSERVED') {
          if (obj.status !== 'HIDDEN' && obj.status !== 'OUTSIDE_FOV' && obj.status !== 'UNOBSERVED') {
            newStatus = obj.status;
            newCertainty = obj.certainty;
            newConfidence = obj.confidenceScore;
            newPos = obj.reconstructedPosition;
          }
        }

        accumulatedMap.set(obj.id, {
          ...existing,
          reconstructedPosition: newPos,
          status: newStatus,
          certainty: newCertainty,
          confidenceScore: newConfidence,
          sourceObserverIds: sourceObservers,
          ambiguityReason: newCertainty === 'EXACT' || newCertainty === 'CONSTRAINED' ? null : obj.ambiguityReason,
        });
      }
    }

    const cumulativeObjects = Array.from(accumulatedMap.values());
    const knownCount = cumulativeObjects.filter((o) => o.status === 'KNOWN').length;
    const ambiguousCount = cumulativeObjects.filter((o) => o.status === 'AMBIGUOUS' || o.status === 'DIMENSIONALLY_COLLAPSED').length;
    const hiddenCount = cumulativeObjects.filter((o) => o.status === 'HIDDEN').length;
    const outsideFovCount = cumulativeObjects.filter((o) => o.status === 'OUTSIDE_FOV' || o.status === 'UNOBSERVED').length;
    const totalScore = cumulativeObjects.reduce((sum, o) => sum + o.confidenceScore, 0);

    const cumulativeRecon: F89ReconstructedReality = Object.freeze({
      reconstructionId: `RECON_CUMULATIVE_STEP_${idx}`,
      observerId: step.observer.observerId,
      objects: Object.freeze(cumulativeObjects),
      totalObjectsInReality: groundTruthState.objects.length,
      knownObjectsCount: knownCount,
      ambiguousObjectsCount: ambiguousCount,
      hiddenObjectsCount: hiddenCount,
      outsideFovObjectsCount: outsideFovCount,
      overallCertaintyScore: Number((totalScore / groundTruthState.objects.length).toFixed(2)),
      isCompleteReconstruction: knownCount === groundTruthState.objects.length,
      reconstructionChecksum: computeReconstructionChecksum(cumulativeObjects),
    });

    return {
      stepIndex: idx,
      observerState: step.observer,
      displayState: step.display,
      cumulativeReconstruction: cumulativeRecon,
    };
  });

  const finalRecon = historySteps[historySteps.length - 1].cumulativeReconstruction;

  return Object.freeze({
    historyId: `HIST_F89_${groundTruthState.stateId}`,
    steps: Object.freeze(historySteps),
    totalSteps: historySteps.length,
    finalReconstruction: finalRecon,
  });
}
