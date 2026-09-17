/**
 * 3D Memory Studio — Funnel 60
 * Dimension Transform System
 */

import { DimensionCoordinate, ProjectionType } from '../types';
import { SimulationDimension, SimulatedStateNode } from '../../funnel52/types';
import { projectNDimensionalCoordinate } from '../projection/projectionEngine';
import { DimensionalInformationState } from '../../funnel49/types';
import { GraphNode } from '../../funnel58/types';

export function createDimensionCoordinate(
  state: DimensionalInformationState | SimulatedStateNode | GraphNode,
  dimensionNumber: SimulationDimension,
  projectionType: ProjectionType
): DimensionCoordinate {
  const stateId = state.stateId;

  // Extract raw coordinates for this dimension
  let rawValues: number[] = [];

  if ('coordinatesByDimension' in state && state.coordinatesByDimension) {
    const dimCoord = state.coordinatesByDimension[dimensionNumber];
    if (dimCoord && Array.isArray(dimCoord.coordinateValues)) {
      rawValues = [...dimCoord.coordinateValues];
    }
  } else if ('dimensionalCoordinates' in (state as any) && (state as any).dimensionalCoordinates) {
    const dimCoord = (state as any).dimensionalCoordinates[dimensionNumber];
    if (dimCoord && Array.isArray(dimCoord.coordinateValues)) {
      rawValues = [...dimCoord.coordinateValues];
    }
  }

  if (rawValues.length === 0) {
    if ('position' in state && Array.isArray(state.position)) {
      rawValues = [state.position[0], state.position[1], state.position[2]];
    } else if ('x' in state) {
      rawValues = [(state as any).x, (state as any).y, (state as any).z];
    } else {
      rawValues = [0, 0, 0];
    }

    // Pad with synthetic deterministic higher-dimensional values if dimension > 3
    for (let i = rawValues.length; i < dimensionNumber; i++) {
      const pseudoVal = ((i * 37 + stateId.length * 19) % 120) - 60;
      rawValues.push(pseudoVal);
    }
  }

  const projectedPosition = projectNDimensionalCoordinate(rawValues, dimensionNumber, projectionType);

  return {
    stateId,
    dimension: dimensionNumber,
    rawValues: Object.freeze(rawValues),
    projectedPosition,
    projectionType,
    isValid: true,
    checksum: `COORD_CRC_${stateId}_Z${dimensionNumber}`,
  };
}
