/**
 * 3D Memory Studio — Funnel 85
 * Projection: View Space → Normalized Projection Space (V → P)
 */

import { F85ProjectionType } from '../types';

export function transformViewToProjection(
  viewPos: readonly [number, number, number],
  projectionType: F85ProjectionType,
  focalLength = 300,
  wCoord = 0
): {
  projectedPos: [number, number, number];
  visible: boolean;
} {
  const [vx, vy, vz] = viewPos;

  switch (projectionType) {
    case 'PERSPECTIVE_3D': {
      const depth = Math.max(10, 100 + vz);
      const factor = focalLength / depth;
      return {
        projectedPos: [vx * factor, vy * factor, vz],
        visible: vz > -80,
      };
    }

    case 'ORTHOGRAPHIC_3D': {
      return {
        projectedPos: [vx, vy, vz],
        visible: true,
      };
    }

    case 'ISOMETRIC_3D': {
      const cos30 = 0.866;
      const sin30 = 0.5;
      const ix = (vx - vz) * cos30;
      const iy = vy + (vx + vz) * sin30;
      return {
        projectedPos: [ix, iy, (vx + vy + vz) / 3],
        visible: true,
      };
    }

    case 'DIMENSIONAL_SLICE_Z4_Z3': {
      // Slicing at W = 0 +- 15
      const isInside = Math.abs(wCoord) <= 15;
      return {
        projectedPos: [vx, vy, vz],
        visible: isInside,
      };
    }

    case 'DIMENSIONAL_COLLAPSE_Z4_Z3': {
      const f4D = 50;
      const d4D = Math.max(1, f4D + wCoord);
      const factor4D = f4D / d4D;
      return {
        projectedPos: [vx * factor4D, vy * factor4D, vz * factor4D],
        visible: true,
      };
    }

    case 'DIMENSIONAL_PROJECT_Z3_Z2': {
      return {
        projectedPos: [vx, vy, 0],
        visible: true,
      };
    }

    case 'DIMENSIONAL_PROJECT_Z2_Z1': {
      return {
        projectedPos: [vx, 0, 0],
        visible: true,
      };
    }

    default:
      return {
        projectedPos: [vx, vy, vz],
        visible: true,
      };
  }
}
