/**
 * 3D Memory Studio — Funnel 84
 * Projection: Dimensional Projection Engine (Z4 → Z3, Z3 → Z2, Z2 → Z1)
 *
 * Implements mathematical & computational dimensional reduction models
 * without mutating underlying higher-dimensional coordinates.
 */

import { ObservedObject, ProjectionState } from '../types';

export interface DimensionalProjectedPoint {
  readonly id: string;
  readonly projectedCoordinates: readonly number[];
  readonly apparentScale: number;
  readonly visible: boolean;
  readonly opacity: number;
}

export function projectDimensionalPoint(
  obj: ObservedObject,
  projection: ProjectionState
): DimensionalProjectedPoint {
  const [rx = 0, ry = 0, rz = 0, rw = 0] = obj.relativePosition;

  switch (projection.projectionType) {
    case 'DIMENSIONAL_SLICE_Z4_Z3': {
      // Z4 → Z3 by slicing: only objects within sliceW ± sliceThickness are visible
      const sliceW = projection.sliceW ?? 0;
      const thickness = projection.sliceThickness ?? 10;
      const wDist = Math.abs(rw - sliceW);
      const isInsideSlice = wDist <= thickness;
      const sliceOpacity = isInsideSlice ? Math.max(0.2, 1 - wDist / thickness) : 0;

      return {
        id: obj.id,
        projectedCoordinates: [rx, ry, rz],
        apparentScale: obj.apparentScale,
        visible: isInsideSlice && obj.visible,
        opacity: Number(sliceOpacity.toFixed(4)),
      };
    }

    case 'DIMENSIONAL_COLLAPSE_Z4_Z3': {
      // Z4 → Z3 by stereographic/perspective projection of 4th dimension
      const focal4D = 50;
      const depth4D = Math.max(1, focal4D + rw);
      const factor4D = focal4D / depth4D;

      return {
        id: obj.id,
        projectedCoordinates: [rx * factor4D, ry * factor4D, rz * factor4D],
        apparentScale: obj.apparentScale * factor4D,
        visible: obj.visible,
        opacity: 1.0,
      };
    }

    case 'DIMENSIONAL_PROJECT_Z3_Z2':
    case 'PLANAR_ORTHO_Z2': {
      // Z3 → Z2: project onto XY plane
      return {
        id: obj.id,
        projectedCoordinates: [rx, ry],
        apparentScale: obj.apparentScale,
        visible: obj.visible,
        opacity: 1.0,
      };
    }

    case 'DIMENSIONAL_PROJECT_Z2_Z1': {
      // Z2 → Z1: project onto 1D linear coordinate
      return {
        id: obj.id,
        projectedCoordinates: [rx],
        apparentScale: obj.apparentScale,
        visible: obj.visible,
        opacity: 1.0,
      };
    }

    case 'PERSPECTIVE_3D':
    case 'ORTHOGRAPHIC_3D':
    case 'ISOMETRIC_3D':
    default: {
      return {
        id: obj.id,
        projectedCoordinates: [rx, ry, rz],
        apparentScale: obj.apparentScale,
        visible: obj.visible,
        opacity: 1.0,
      };
    }
  }
}
