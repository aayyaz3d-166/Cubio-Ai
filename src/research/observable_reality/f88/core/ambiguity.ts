/**
 * 3D Memory Studio — Funnel 88
 * Core: Ambiguity Metrics Calculator
 */

import { F88InformationMetrics, F88ObjectDisplayRecord, F88ProjectionType } from '../types';

export function calculateInformationMetrics(
  records: readonly F88ObjectDisplayRecord[],
  projectionType: F88ProjectionType,
  totalRealityObjects = 7,
  stateDimension = 3
): F88InformationMetrics {
  const visibleCount = records.filter((r) => r.visibleInDisplay).length;
  const hiddenCount = totalRealityObjects - visibleCount;

  let projectedDimension = 2;
  let discardedComponentsPerObject = 1; // Z coordinate lost in 3D->2D

  if (projectionType.includes('Z4')) {
    discardedComponentsPerObject = 2; // W & Z lost in 4D->2D
  } else if (projectionType === 'DIMENSIONAL_PROJECT_Z2_Z1') {
    projectedDimension = 1;
    discardedComponentsPerObject = 2;
  }

  const screenCollisions = records.filter((r) => r.isOccluded).length;

  // Ambiguity score: increases with hidden objects, discarded dimensions, and collisions
  let ambiguityScore = 0;
  if (hiddenCount > 0) ambiguityScore += hiddenCount * 0.15;
  if (discardedComponentsPerObject > 0) ambiguityScore += discardedComponentsPerObject * 0.2;
  if (screenCollisions > 0) ambiguityScore += screenCollisions * 0.15;
  if (projectionType.includes('ORTHOGRAPHIC')) ambiguityScore += 0.3; // Depth fully lost

  ambiguityScore = Number(Math.min(1.0, ambiguityScore).toFixed(2));
  const isInverseUnique = ambiguityScore === 0 && hiddenCount === 0;

  // Estimated reconstruction multiplicity: 1 if unique, 2^k if ambiguous
  const reconstructionMultiplicity = isInverseUnique ? 1 : Math.max(2, Math.pow(2, hiddenCount + discardedComponentsPerObject));

  return Object.freeze({
    stateDimension,
    projectedDimension,
    totalObjectsInReality: totalRealityObjects,
    visibleObjectsInDisplay: visibleCount,
    hiddenObjectsCount: hiddenCount,
    discardedCoordinateComponents: discardedComponentsPerObject * totalRealityObjects,
    screenCollisions,
    reconstructionMultiplicity,
    ambiguityScore,
    isInverseUnique,
  });
}
