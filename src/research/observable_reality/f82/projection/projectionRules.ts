/**
 * 3D Memory Studio — Funnel 82
 * Projection Transformation Rules
 */

import { Coordinate4D, Coordinate3D, F82ProjectionType, Observer } from '../types';

export interface ProjectedPoint {
  readonly position: Coordinate3D;
  readonly visible: boolean;
  readonly apparentScale: number;
  readonly opacity: number;
}

export function project4DPointTo3D(
  coord: Coordinate4D,
  observer: Observer
): ProjectedPoint {
  const [x, y, z, w] = coord;

  switch (observer.projectionType) {
    case 'DIRECT_ORTHOGRAPHIC_3D': {
      return {
        position: Object.freeze([
          Number(x.toFixed(4)),
          Number(y.toFixed(4)),
          Number(z.toFixed(4)),
        ]),
        visible: true,
        apparentScale: 1.0,
        opacity: 1.0,
      };
    }

    case 'PERSPECTIVE_PINHOLE_3D': {
      // W acts as 4D depth parameter
      const focal = Math.max(0.1, observer.focalLength);
      const depth4D = Math.max(0.1, focal + w * 0.2);
      const factor = focal / depth4D;

      return {
        position: Object.freeze([
          Number((x * factor).toFixed(4)),
          Number((y * factor).toFixed(4)),
          Number((z * factor).toFixed(4)),
        ]),
        visible: depth4D > 0,
        apparentScale: Number(Math.max(0.01, factor).toFixed(4)),
        opacity: Number(Math.min(1.0, Math.max(0.1, factor)).toFixed(4)),
      };
    }

    case 'SLICED_HYPERPLANE_3D': {
      // Hyperplane slice at sliceW with sliceThickness
      const deltaW = Math.abs(w - observer.sliceW);
      const isVisible = deltaW <= observer.sliceThickness;
      const attenuation = Math.max(0, 1 - deltaW / Math.max(0.001, observer.sliceThickness));

      return {
        position: Object.freeze([
          Number(x.toFixed(4)),
          Number(y.toFixed(4)),
          Number(z.toFixed(4)),
        ]),
        visible: isVisible,
        apparentScale: Number(attenuation.toFixed(4)),
        opacity: Number(attenuation.toFixed(4)),
      };
    }

    case 'CONVERGENT_ENERGY_3D': {
      const warp = 1.0 + Math.sin(w) * 0.15;
      return {
        position: Object.freeze([
          Number((x * warp).toFixed(4)),
          Number((y * warp).toFixed(4)),
          Number((z * warp).toFixed(4)),
        ]),
        visible: true,
        apparentScale: Number(warp.toFixed(4)),
        opacity: 1.0,
      };
    }

    case 'COMPUTATIONAL_SHADOW_3D':
    default: {
      const shadowFactor = 1.0 / (1.0 + Math.abs(w) * 0.05);
      return {
        position: Object.freeze([
          Number((x + w * 0.1).toFixed(4)),
          Number((y + w * 0.1).toFixed(4)),
          Number(z.toFixed(4)),
        ]),
        visible: true,
        apparentScale: Number(shadowFactor.toFixed(4)),
        opacity: Number(shadowFactor.toFixed(4)),
      };
    }
  }
}
