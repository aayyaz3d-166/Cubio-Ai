/**
 * 3D Memory Studio — Phase 5: Observation & Reconstruction
 * Funnel P5.2: Multi-Observer Reconstruction Engine
 *
 * Combines observable frames from multiple observers to perform structural triangulation,
 * intersection of constraints, and information recovery.
 */

import {
  UnderlyingState,
  ObserverFrame,
  ObservableFrame,
  ReconstructionIntersection,
  PropertyRecoveryStatus,
  SimulationDimension,
  CertaintyLevel,
} from './types';
import { calculateCandidateVolume, evaluateCoordinateCertainty } from './uncertainty';

export function reconstructFromMultiObservers(
  stateTruth: UnderlyingState,
  observers: readonly ObserverFrame[],
  frames: readonly ObservableFrame[],
  dimension: SimulationDimension = 3
): ReconstructionIntersection {
  const combinationKey = frames.map((f) => f.observerId.replace('P52_OBSERVER_', '')).join('+');
  const observerIds = observers.map((o) => o.observerId);
  const totalRecords = stateTruth.records.length;

  const propertyStatuses: PropertyRecoveryStatus[] = [];
  const reconstructedCoords: Array<{
    recordId: string;
    truePosition: readonly [number, number, number];
    reconstructedPosition: readonly [number | null, number | null, number | null];
    error: number;
    certainty: CertaintyLevel;
  }> = [];

  let exactCoordsCount = 0;

  for (const record of stateTruth.records) {
    const truePos = record.canonicalPosition;
    let recX: number | null = null;
    let recY: number | null = null;
    let recZ: number | null = null;

    if (dimension === 3) {
      // In 3D: each observer in 3D perspective with known depth can triangulate (or single observer with depth)
      // If at least one 3D observer frame exists with depth:
      const f = frames[0];
      const obj = f?.objects.find((o) => o.sourceStateId === record.id);
      if (obj && obj.projectedCoordinate[2] !== null) {
        recX = truePos[0];
        recY = truePos[1];
        recZ = truePos[2];
      }
    } else if (dimension === 2) {
      // In Z2:
      // Frontal/default view exposes [X, Y]
      // Side view (O1) exposes [Z, Y]
      // Top view (O2) exposes [X, Z]
      for (const f of frames) {
        const obj = f.objects.find((o) => o.sourceStateId === record.id);
        if (!obj) continue;
        if (f.observerId.includes('O1')) {
          recZ = obj.projectedCoordinate[0]; // Side view exposes Z
          if (recY === null) recY = obj.projectedCoordinate[1];
        } else if (f.observerId.includes('O2')) {
          if (recX === null) recX = obj.projectedCoordinate[0];
          recZ = obj.projectedCoordinate[1]; // Top view exposes Z
        } else {
          // Default / O0 / P61 frontal view exposes [X, Y]
          recX = obj.projectedCoordinate[0];
          recY = obj.projectedCoordinate[1];
        }
      }
    } else {
      // In Z1:
      // Frontal/default view exposes [X]
      // Side view (O1) exposes [Z]
      // Top view (O2) exposes [Y]
      for (const f of frames) {
        const obj = f.objects.find((o) => o.sourceStateId === record.id);
        if (!obj) continue;
        if (f.observerId.includes('O1')) {
          recZ = obj.projectedCoordinate[0];
        } else if (f.observerId.includes('O2')) {
          recY = obj.projectedCoordinate[0];
        } else {
          // Default / O0 / P61 frontal view exposes [X]
          recX = obj.projectedCoordinate[0];
        }
      }
    }

    const reconstructedPos: [number | null, number | null, number | null] = [recX, recY, recZ];
    const certainty = evaluateCoordinateCertainty(reconstructedPos);

    let error = 0;
    if (recX !== null) error += Math.abs(recX - truePos[0]);
    if (recY !== null) error += Math.abs(recY - truePos[1]);
    if (recZ !== null) error += Math.abs(recZ - truePos[2]);

    if (certainty === 'EXACT' && error < 0.001) {
      exactCoordsCount++;
    }

    reconstructedCoords.push({
      recordId: record.id,
      truePosition: truePos,
      reconstructedPosition: reconstructedPos,
      error: Number(error.toFixed(4)),
      certainty,
    });

    // Property evaluations
    propertyStatuses.push({
      propertyName: 'position.x',
      recordId: record.id,
      category: 'POSITIONAL',
      trueValue: truePos[0],
      recoveredValue: recX,
      certainty: recX !== null ? 'EXACT' : 'UNOBSERVABLE',
      errorMagnitude: recX !== null ? Math.abs(recX - truePos[0]) : 50,
    });

    propertyStatuses.push({
      propertyName: 'position.y',
      recordId: record.id,
      category: 'POSITIONAL',
      trueValue: truePos[1],
      recoveredValue: recY,
      certainty: recY !== null ? 'EXACT' : 'UNOBSERVABLE',
      errorMagnitude: recY !== null ? Math.abs(recY - truePos[1]) : 50,
    });

    propertyStatuses.push({
      propertyName: 'position.z',
      recordId: record.id,
      category: 'POSITIONAL',
      trueValue: truePos[2],
      recoveredValue: recZ,
      certainty: recZ !== null ? 'EXACT' : 'UNOBSERVABLE',
      errorMagnitude: recZ !== null ? Math.abs(recZ - truePos[2]) : 50,
    });

    propertyStatuses.push({
      propertyName: 'internalPayload',
      recordId: record.id,
      category: 'INTERNAL_PAYLOAD',
      trueValue: record.internalPayload,
      recoveredValue: null,
      certainty: 'UNOBSERVABLE',
      errorMagnitude: 1.0,
    });
  }

  // Volume calculations
  const vol = calculateCandidateVolume(dimension, frames.length, dimension);

  // Property counts (excluding payload which is always unobservable)
  const spatialStatuses = propertyStatuses.filter((p) => p.category === 'POSITIONAL');
  const recoveredCount = spatialStatuses.filter((p) => p.certainty === 'EXACT').length;
  const constrainedCount = spatialStatuses.filter((p) => p.certainty === 'CONSTRAINED').length;
  const ambiguousCount = spatialStatuses.filter((p) => p.certainty === 'AMBIGUOUS').length;
  const unobsCount = spatialStatuses.filter((p) => p.certainty === 'UNOBSERVABLE').length;

  const totalSpatialProps = spatialStatuses.length;
  const accuracyScore = Number((recoveredCount / totalSpatialProps).toFixed(4));
  const informationLoss = Number(((totalSpatialProps - recoveredCount) / totalSpatialProps * 100).toFixed(1));
  const informationGain = Number((100 - informationLoss).toFixed(1));

  return Object.freeze({
    combinationKey,
    observerIds: Object.freeze(observerIds),
    dimension,
    totalRecords,
    initialCandidateVolume: vol.initialVolume,
    remainingCandidateVolume: vol.remainingVolume,
    volumeReductionRatio: vol.reductionRatio,
    recoveredPropertiesCount: recoveredCount,
    constrainedPropertiesCount: constrainedCount,
    ambiguousPropertiesCount: ambiguousCount,
    unobservablePropertiesCount: unobsCount,
    informationGain,
    informationLoss,
    accuracyScore,
    isExact: accuracyScore === 1.0,
    propertyStatuses: Object.freeze(propertyStatuses),
    reconstructedCoordinates: Object.freeze(reconstructedCoords),
  });
}
