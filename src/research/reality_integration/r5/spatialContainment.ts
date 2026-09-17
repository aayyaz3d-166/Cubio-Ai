/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R5: Spatial Containment Engine
 *
 * Evaluates bounding-box containment, overlap, intersection, and disjoint status.
 */

import { SpatialContainment } from './types';

export class SpatialContainmentEngine {
  public static evaluateContainment(
    coordA?: readonly [number, number, number],
    dimA?: readonly [number, number, number],
    coordB?: readonly [number, number, number],
    dimB?: readonly [number, number, number]
  ): SpatialContainment {
    if (!coordA || !dimA || !coordB || !dimB) {
      return Object.freeze({
        classification: 'UNKNOWN',
      });
    }

    const minA = [coordA[0] - dimA[0] / 2, coordA[1] - dimA[1] / 2, coordA[2] - dimA[2] / 2];
    const maxA = [coordA[0] + dimA[0] / 2, coordA[1] + dimA[1] / 2, coordA[2] + dimA[2] / 2];

    const minB = [coordB[0] - dimB[0] / 2, coordB[1] - dimB[1] / 2, coordB[2] - dimB[2] / 2];
    const maxB = [coordB[0] + dimB[0] / 2, coordB[1] + dimB[1] / 2, coordB[2] + dimB[2] / 2];

    // Check if A contains B
    const aContainsB =
      minA[0] <= minB[0] && maxA[0] >= maxB[0] &&
      minA[1] <= minB[1] && maxA[1] >= maxB[1] &&
      minA[2] <= minB[2] && maxA[2] >= maxB[2];

    if (aContainsB) {
      return Object.freeze({
        classification: 'CONTAINS',
        overlapVolumeRatio: 1.0,
      });
    }

    // Check if B contains A (A is inside B)
    const bContainsA =
      minB[0] <= minA[0] && maxB[0] >= maxA[0] &&
      minB[1] <= minA[1] && maxB[1] >= maxA[1] &&
      minB[2] <= minA[2] && maxB[2] >= maxA[2];

    if (bContainsA) {
      return Object.freeze({
        classification: 'INSIDE',
        overlapVolumeRatio: 1.0,
      });
    }

    // Check overlap / intersection
    const overlapX = Math.max(0, Math.min(maxA[0], maxB[0]) - Math.max(minA[0], minB[0]));
    const overlapY = Math.max(0, Math.min(maxA[1], maxB[1]) - Math.max(minA[1], minB[1]));
    const overlapZ = Math.max(0, Math.min(maxA[2], maxB[2]) - Math.max(minA[2], minB[2]));

    const overlapVolume = overlapX * overlapY * overlapZ;
    const volA = dimA[0] * dimA[1] * dimA[2];

    if (overlapVolume > 0) {
      return Object.freeze({
        classification: 'OVERLAPS',
        overlapVolumeRatio: volA > 0 ? overlapVolume / volA : 0,
      });
    }

    return Object.freeze({
      classification: 'DISJOINT',
      overlapVolumeRatio: 0,
    });
  }
}
