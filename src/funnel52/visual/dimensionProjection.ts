/**
 * 3D Memory Studio — Funnel 52
 * Dimension Projection & Loss Analysis Engine
 */

import { SimulationDimension, SimulationProjectionTelemetry } from '../types';

export function analyzeDimensionProjection(
  sourceDimension: SimulationDimension,
  targetDimension: SimulationDimension,
  canonicalChecksum = 'CHK_CANONICAL_PROJECTION_F52'
): SimulationProjectionTelemetry {
  if (targetDimension === sourceDimension) {
    const axes = Array.from({ length: targetDimension }, (_, i) => `AXIS_${i + 1}`);
    return Object.freeze({
      sourceDimension,
      targetDimension,
      mode: 'DIRECT',
      preservedAxes: Object.freeze(axes),
      discardedAxes: Object.freeze([]),
      derivedAxes: Object.freeze([]),
      informationLossDetected: false,
      preservedChecksum: canonicalChecksum,
    });
  }

  // Lower Dimension Projection (e.g. Z8 -> Z3)
  if (targetDimension < sourceDimension) {
    const preserved = Array.from({ length: targetDimension }, (_, i) =>
      i === 0 ? 'AXIS_1 (X)' : i === 1 ? 'AXIS_2 (Y)' : i === 2 ? 'AXIS_3 (Z)' : `AXIS_${i + 1}`
    );
    const discarded = Array.from(
      { length: sourceDimension - targetDimension },
      (_, i) => `AXIS_${targetDimension + i + 1}`
    );

    return Object.freeze({
      sourceDimension,
      targetDimension,
      mode: 'LOWER_PROJECTION',
      preservedAxes: Object.freeze(preserved),
      discardedAxes: Object.freeze(discarded),
      derivedAxes: Object.freeze([]),
      informationLossDetected: true,
      preservedChecksum: canonicalChecksum,
    });
  }

  // Higher Dimension Projection (e.g. Z3 -> Z8)
  const original = Array.from({ length: sourceDimension }, (_, i) =>
    i === 0 ? 'AXIS_1 (X)' : i === 1 ? 'AXIS_2 (Y)' : i === 2 ? 'AXIS_3 (Z)' : `AXIS_${i + 1}`
  );
  const derived = Array.from(
    { length: targetDimension - sourceDimension },
    (_, i) => `DERIVED_AXIS_${sourceDimension + i + 1}`
  );

  return Object.freeze({
    sourceDimension,
    targetDimension,
    mode: 'HIGHER_PROJECTION',
    preservedAxes: Object.freeze(original),
    discardedAxes: Object.freeze([]),
    derivedAxes: Object.freeze(derived),
    informationLossDetected: false,
    preservedChecksum: canonicalChecksum,
  });
}
