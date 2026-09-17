/**
 * 3D Memory Studio — Funnel 89
 * Core: Reconstruction Model (D → R)
 */

import {
  F89DisplayState,
  F89ObserverState,
  F89ReconstructedObject,
  F89ReconstructedReality,
  F89SpatialState,
} from '../types';

export function computeReconstructionChecksum(objects: readonly F89ReconstructedObject[]): string {
  let hash = 0x811c9dc5;
  const str = objects
    .map(
      (o) =>
        `${o.id}:${o.status}:${o.certainty}:${o.confidenceScore.toFixed(2)}:[${o.reconstructedPosition
          .map((v) => (v !== null ? v.toFixed(1) : 'NULL'))
          .join(',')}]`
    )
    .sort()
    .join('|');

  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function buildReconstructedReality(
  display: F89DisplayState,
  observer: F89ObserverState,
  groundTruthState: F89SpatialState
): F89ReconstructedReality {
  const centerX = display.width / 2;
  const centerY = display.height / 2;

  let knownCount = 0;
  let ambiguousCount = 0;
  let hiddenCount = 0;
  let outsideFovCount = 0;
  let totalConfidence = 0;

  const reconstructedObjects: F89ReconstructedObject[] = groundTruthState.objects.map((trueObj) => {
    const obsRec = display.observationRecords.find((r) => r.id === trueObj.id);

    if (!obsRec) {
      hiddenCount++;
      return {
        id: trueObj.id,
        canonicalCoordinate: trueObj.canonicalCoordinate,
        trueWorldPosition: trueObj.experimentalWorldPosition,
        reconstructedPosition: [null, null, null],
        status: 'UNOBSERVED',
        certainty: 'UNKNOWN',
        confidenceScore: 0.0,
        sourceObserverIds: [observer.observerId],
        ambiguityReason: 'Object completely absent from observation buffer',
        color: trueObj.color,
        label: trueObj.label,
      };
    }

    if (!obsRec.inFrustum) {
      outsideFovCount++;
      return {
        id: trueObj.id,
        canonicalCoordinate: trueObj.canonicalCoordinate,
        trueWorldPosition: trueObj.experimentalWorldPosition,
        reconstructedPosition: [null, null, null],
        status: 'OUTSIDE_FOV',
        certainty: 'UNKNOWN',
        confidenceScore: 0.0,
        sourceObserverIds: [observer.observerId],
        ambiguityReason: 'Target located outside observer field of view (> 30°)',
        color: trueObj.color,
        label: trueObj.label,
      };
    }

    if (obsRec.isOccluded) {
      hiddenCount++;
      return {
        id: trueObj.id,
        canonicalCoordinate: trueObj.canonicalCoordinate,
        trueWorldPosition: trueObj.experimentalWorldPosition,
        reconstructedPosition: [null, null, null],
        status: 'HIDDEN',
        certainty: 'UNKNOWN',
        confidenceScore: 0.0,
        sourceObserverIds: [observer.observerId],
        ambiguityReason: `Occluded along viewing ray by ${obsRec.occludedBy?.replace('STATE49:', '')}`,
        color: trueObj.color,
        label: trueObj.label,
      };
    }

    // Object is visible in display!
    const sx = obsRec.screenPosition[0];
    const sy = obsRec.screenPosition[1];
    const rx = Number(((sx - centerX) / 12).toFixed(2));
    const ry = Number(((centerY - sy) / 12).toFixed(2));

    if (display.projectionType.includes('ORTHOGRAPHIC')) {
      // Depth Z is completely lost in orthographic projection!
      ambiguousCount++;
      totalConfidence += 0.66;
      return {
        id: trueObj.id,
        canonicalCoordinate: trueObj.canonicalCoordinate,
        trueWorldPosition: trueObj.experimentalWorldPosition,
        reconstructedPosition: [rx, ry, null], // Z is explicitly null (unknown)
        status: 'AMBIGUOUS',
        certainty: 'AMBIGUOUS',
        confidenceScore: 0.66,
        sourceObserverIds: [observer.observerId],
        ambiguityReason: 'Depth Z is unconstrained under orthogonal parallel projection',
        color: trueObj.color,
        label: trueObj.label,
      };
    }

    if (display.projectionType === 'DIMENSIONAL_PROJECT_Z2_Z1') {
      ambiguousCount++;
      totalConfidence += 0.33;
      return {
        id: trueObj.id,
        canonicalCoordinate: trueObj.canonicalCoordinate,
        trueWorldPosition: trueObj.experimentalWorldPosition,
        reconstructedPosition: [rx, null, null], // Y and Z are lost
        status: 'DIMENSIONALLY_COLLAPSED',
        certainty: 'AMBIGUOUS',
        confidenceScore: 0.33,
        sourceObserverIds: [observer.observerId],
        ambiguityReason: '1D linear projection discarded Y and Z coordinates',
        color: trueObj.color,
        label: trueObj.label,
      };
    }

    // Perspective 3D: recoverable apparent depth from apparent scale
    knownCount++;
    totalConfidence += 1.0;
    return {
      id: trueObj.id,
      canonicalCoordinate: trueObj.canonicalCoordinate,
      trueWorldPosition: trueObj.experimentalWorldPosition,
      reconstructedPosition: [rx, ry, obsRec.depthZ],
      status: 'KNOWN',
      certainty: 'EXACT',
      confidenceScore: 1.0,
      sourceObserverIds: [observer.observerId],
      ambiguityReason: null,
      color: trueObj.color,
      label: trueObj.label,
    };
  });

  const overallCertaintyScore = Number(
    (totalConfidence / groundTruthState.objects.length).toFixed(2)
  );
  const isComplete = knownCount === groundTruthState.objects.length;
  const reconstructionChecksum = computeReconstructionChecksum(reconstructedObjects);

  return Object.freeze({
    reconstructionId: `RECON_${display.experimentType}_${observer.observerId}_${display.projectionType}`,
    observerId: observer.observerId,
    objects: Object.freeze(reconstructedObjects),
    totalObjectsInReality: groundTruthState.objects.length,
    knownObjectsCount: knownCount,
    ambiguousObjectsCount: ambiguousCount,
    hiddenObjectsCount: hiddenCount,
    outsideFovObjectsCount: outsideFovCount,
    overallCertaintyScore,
    isCompleteReconstruction: isComplete,
    reconstructionChecksum,
  });
}
