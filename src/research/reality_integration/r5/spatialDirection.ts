/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R5: Spatial Direction Engine
 *
 * Implements deterministic directional classification (ABOVE, BELOW, LEFT, RIGHT, FRONT, BEHIND).
 */

import {
  SpatialDirection,
  SpatialDirectionType,
} from './types';

export class SpatialDirectionEngine {
  public static evaluateDirection(
    coordA?: readonly [number, number, number],
    coordB?: readonly [number, number, number]
  ): SpatialDirection {
    if (!coordA || !coordB) {
      return Object.freeze({
        primaryDirection: 'UNKNOWN',
        axisDominance: 'NONE',
        directionalVectors: Object.freeze([0, 0, 0] as [number, number, number]),
      });
    }

    const dx = coordB[0] - coordA[0];
    const dy = coordB[1] - coordA[1];
    const dz = coordB[2] - coordA[2];

    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    const absZ = Math.abs(dz);

    if (absX === 0 && absY === 0 && absZ === 0) {
      return Object.freeze({
        primaryDirection: 'SAME_POSITION',
        axisDominance: 'NONE',
        directionalVectors: Object.freeze([0, 0, 0] as [number, number, number]),
      });
    }

    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    const dirVector: [number, number, number] = dist > 0
      ? [dx / dist, dy / dist, dz / dist]
      : [0, 0, 0];

    let axisDominance: 'X' | 'Y' | 'Z' = 'X';
    let primaryDirection: SpatialDirectionType = 'RIGHT';

    if (absZ >= absX && absZ >= absY) {
      axisDominance = 'Z';
      primaryDirection = dz > 0 ? 'ABOVE' : 'BELOW';
    } else if (absX >= absY && absX >= absZ) {
      axisDominance = 'X';
      primaryDirection = dx > 0 ? 'RIGHT' : 'LEFT';
    } else {
      axisDominance = 'Y';
      primaryDirection = dy > 0 ? 'FRONT' : 'BEHIND';
    }

    return Object.freeze({
      primaryDirection,
      axisDominance,
      directionalVectors: Object.freeze(dirVector as [number, number, number]),
    });
  }
}
