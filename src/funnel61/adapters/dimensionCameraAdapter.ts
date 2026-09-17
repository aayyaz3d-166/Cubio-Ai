/**
 * 3D Memory Studio — Funnel 61
 * Dimension Camera Adapter
 */

import { DimensionEngine } from '../../funnel60/dimension/dimensionEngine';
import { CameraState } from '../types';
import { panTo } from '../camera/panController';
import { SimulationDimension } from '../../funnel52/types';

export function handleDimensionSwitchForCamera(
  state: CameraState,
  newDimension: SimulationDimension,
  dimensionEngine: DimensionEngine
): void {
  state.dimension = newDimension;

  if (state.focusedObjectId) {
    const projected = dimensionEngine.getCoordinate(state.focusedObjectId);
    if (projected) {
      panTo(state, projected.projectedPosition);
    }
  }
}
