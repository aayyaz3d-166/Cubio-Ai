/**
 * 3D Memory Studio — Funnel 60
 * Dimension Axis System
 */

import { DimensionAxis, DimensionId } from '../types';
import { SimulationDimension } from '../../funnel52/types';

export function createAxesForDimension(
  dimensionId: DimensionId,
  axisCount: number
): DimensionAxis[] {
  const axes: DimensionAxis[] = [];
  const primaryNames = ['X', 'Y', 'Z'];

  for (let i = 0; i < axisCount; i++) {
    const isPrimary = i < 3;
    const label = isPrimary ? primaryNames[i] : `A${i + 1}`;
    const isComputational = !isPrimary;

    axes.push({
      axisId: `AXIS_${dimensionId}_${label}`,
      dimensionId,
      label,
      index: i,
      isComputational,
      visible: true,
      scale: 1.0,
      origin: [0, 0, 0],
    });
  }

  return axes;
}
