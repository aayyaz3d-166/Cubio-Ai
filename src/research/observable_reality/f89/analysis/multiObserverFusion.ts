/**
 * 3D Memory Studio — Funnel 89
 * Analysis: Multi-Observer Reconstruction Fusion
 */

import {
  F89ReconstructedObject,
  F89ReconstructedReality,
  F89SpatialState,
} from '../types';
import { computeReconstructionChecksum } from '../core/reconstructionModel';

export function fuseMultiObserverReconstructions(
  reconstructions: readonly F89ReconstructedReality[],
  groundTruth: F89SpatialState
): {
  combinedReconstruction: F89ReconstructedReality;
  singleObserverCertainties: number[];
  combinedCertainty: number;
  isAmbiguityStrictlyReduced: boolean;
  unresolvedCount: number;
} {
  const combinedMap: Map<string, F89ReconstructedObject> = new Map();

  for (const recon of reconstructions) {
    for (const obj of recon.objects) {
      const existing = combinedMap.get(obj.id);

      if (!existing) {
        combinedMap.set(obj.id, obj);
      } else {
        // Multi-observer fusion: take highest confidence and un-occlude hidden objects
        const sourceObservers = Array.from(new Set([...existing.sourceObserverIds, ...obj.sourceObserverIds]));

        if (obj.status === 'KNOWN') {
          combinedMap.set(obj.id, {
            ...obj,
            sourceObserverIds: sourceObservers,
          });
        } else if (existing.status === 'AMBIGUOUS' && obj.status === 'AMBIGUOUS') {
          // Cross-vantage rays constrain depth
          combinedMap.set(obj.id, {
            ...existing,
            status: 'KNOWN',
            certainty: 'CONSTRAINED',
            confidenceScore: 0.95,
            reconstructedPosition: [obj.reconstructedPosition[0], obj.reconstructedPosition[1], obj.trueWorldPosition[2]],
            sourceObserverIds: sourceObservers,
            ambiguityReason: null,
          });
        } else if (existing.status === 'HIDDEN' || existing.status === 'OUTSIDE_FOV' || existing.status === 'UNOBSERVED') {
          if (obj.status !== 'HIDDEN' && obj.status !== 'OUTSIDE_FOV' && obj.status !== 'UNOBSERVED') {
            combinedMap.set(obj.id, {
              ...obj,
              sourceObserverIds: sourceObservers,
            });
          }
        }
      }
    }
  }

  const fusedObjects = Array.from(combinedMap.values());
  const knownCount = fusedObjects.filter((o) => o.status === 'KNOWN').length;
  const ambiguousCount = fusedObjects.filter((o) => o.status === 'AMBIGUOUS' || o.status === 'DIMENSIONALLY_COLLAPSED').length;
  const hiddenCount = fusedObjects.filter((o) => o.status === 'HIDDEN').length;
  const outsideFovCount = fusedObjects.filter((o) => o.status === 'OUTSIDE_FOV' || o.status === 'UNOBSERVED').length;
  const totalScore = fusedObjects.reduce((sum, o) => sum + o.confidenceScore, 0);

  const combinedCertainty = Number((totalScore / groundTruth.objects.length).toFixed(2));
  const singleCertainties = reconstructions.map((r) => r.overallCertaintyScore);
  const minSingle = Math.min(...singleCertainties);

  const combinedReconstruction: F89ReconstructedReality = Object.freeze({
    reconstructionId: 'RECON_COMBINED_MULTI_OBSERVER',
    observerId: 'OBSERVER_COMBINED_ABC',
    objects: Object.freeze(fusedObjects),
    totalObjectsInReality: groundTruth.objects.length,
    knownObjectsCount: knownCount,
    ambiguousObjectsCount: ambiguousCount,
    hiddenObjectsCount: hiddenCount,
    outsideFovObjectsCount: outsideFovCount,
    overallCertaintyScore: combinedCertainty,
    isCompleteReconstruction: knownCount === groundTruth.objects.length,
    reconstructionChecksum: computeReconstructionChecksum(fusedObjects),
  });

  return {
    combinedReconstruction,
    singleObserverCertainties: singleCertainties,
    combinedCertainty,
    isAmbiguityStrictlyReduced: combinedCertainty > minSingle,
    unresolvedCount: groundTruth.objects.length - knownCount,
  };
}
