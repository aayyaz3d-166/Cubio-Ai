/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R5: Spatial Distance Engine
 *
 * Implements deterministic distance and axis delta computations.
 */

import { SpatialDistance } from './types';

export class SpatialDistanceEngine {
  public static calculateDistance(
    coordA?: readonly [number, number, number],
    coordB?: readonly [number, number, number]
  ): SpatialDistance {
    if (!coordA || !coordB) {
      return Object.freeze({
        euclideanDistance: 0,
        axisDeltas: Object.freeze([0, 0, 0] as [number, number, number]),
        metricClassification: 'UNKNOWN',
      });
    }

    const dx = coordB[0] - coordA[0];
    const dy = coordB[1] - coordA[1];
    const dz = coordB[2] - coordA[2];

    const distSquared = dx * dx + dy * dy + dz * dz;
    const euclideanDistance = Math.sqrt(distSquared);

    let metricClassification: 'SAME_POSITION' | 'NEAR' | 'FAR' = 'FAR';
    if (euclideanDistance === 0) {
      metricClassification = 'SAME_POSITION';
    } else if (euclideanDistance <= 5.0) {
      metricClassification = 'NEAR';
    } else {
      metricClassification = 'FAR';
    }

    return Object.freeze({
      euclideanDistance,
      axisDeltas: Object.freeze([dx, dy, dz] as [number, number, number]),
      metricClassification,
    });
  }
}
