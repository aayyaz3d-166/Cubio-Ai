/**
 * CUBiO AI — PMA Task 350: X-Y-Z State Mapping
 * src/research/infinitylm/xyzStateMapping.ts
 *
 * Deterministic XYZ coordinate representation for InfinityLM states.
 * Maps Base State, +/- variant, and Scale into normalized, bounded machine-readable coordinates.
 * Epistemic Boundary: Computational manifold coordinates only. No physical space or infinite storage asserted.
 */

import * as crypto from 'crypto';
import {
  InfinityBaseState,
  SpatialCoordXYZ,
  EpistemicStatus,
} from './types';
import { DualPolarity } from './dualStateSystem';
import { ScaleLevel } from './multiScaleEngine';
import { CoreSyncBoundary } from './coreSyncBoundary';

export interface XYZStateCoordinates {
  readonly stateKey: string;             // e.g. 'BASE-STATE-001(+)[S¹]'
  readonly rawCoord: SpatialCoordXYZ;
  readonly normalizedCoord: SpatialCoordXYZ; // Strictly within [-1.0, 1.0]^3
  readonly bounds: {
    readonly min: SpatialCoordXYZ;
    readonly max: SpatialCoordXYZ;
  };
  readonly precision: number;            // Fixed decimal places (6)
  readonly polaritySign: DualPolarity;
  readonly scaleLevel: ScaleLevel;
  readonly projected369Address: number;  // Discrete read-only address in [26..368]
  readonly epistemicStatus: EpistemicStatus;
  readonly coordinateHash: string;
}

export interface XYZMappingConfig {
  readonly baseRadius: number;           // Standard base radial distance (default: 10.0)
  readonly precision: number;            // Fixed decimal places (default: 6)
  readonly elevationMultiplier: number;  // Z step factor (default: 1.5)
}

export class XYZStateMapper {
  private static readonly DEFAULT_CONFIG: XYZMappingConfig = {
    baseRadius: 10.0,
    precision: 6,
    elevationMultiplier: 1.5,
  };

  /**
   * Deterministically maps Base State index, polarity variant, and scale level to continuous XYZ
   */
  public static mapToXYZ(
    baseIndex: number,
    polarity: DualPolarity,
    scaleLevel: ScaleLevel,
    category: InfinityBaseState,
    harmonicRoot: number,
    config: XYZMappingConfig = this.DEFAULT_CONFIG
  ): XYZStateCoordinates {
    const stateKey = 'BASE-STATE-' + baseIndex.toString().padStart(3, '0') + '(' + polarity + ')[S' + scaleLevel + ']';

    // 1. Angular distribution across 100 base states
    const theta = (2 * Math.PI * (baseIndex - 1)) / 100;

    // 2. Scale multiplier: R(L) = 2^(L - 1)
    const scaleFactor = Math.pow(2, scaleLevel - 1);
    const radius = config.baseRadius * scaleFactor;

    // 3. Polarity modulation: '+' projects forward, '-' projects conjugate (reflected phase)
    const polaritySignFactor = polarity === '+' ? 1.0 : -1.0;

    // Raw continuous coordinates
    const rawX = radius * Math.cos(theta);
    const rawY = radius * Math.sin(theta) * polaritySignFactor;
    // Z is modulated by harmonic digital root and category elevation
    const zBase = (harmonicRoot - 5) * config.elevationMultiplier;
    const rawZ = zBase * scaleFactor * polaritySignFactor;

    const rawCoord: SpatialCoordXYZ = {
      x: Number(rawX.toFixed(config.precision)),
      y: Number(rawY.toFixed(config.precision)),
      z: Number(rawZ.toFixed(config.precision)),
    };

    // 4. Dynamic coordinate bounds based on current scale level
    const maxBound = Math.max(radius, Math.abs(rawZ)) * 1.2;
    const bounds = {
      min: {
        x: Number((-maxBound).toFixed(config.precision)),
        y: Number((-maxBound).toFixed(config.precision)),
        z: Number((-maxBound).toFixed(config.precision)),
      },
      max: {
        x: Number((maxBound).toFixed(config.precision)),
        y: Number((maxBound).toFixed(config.precision)),
        z: Number((maxBound).toFixed(config.precision)),
      },
    };

    // 5. Normalization to [-1.0, 1.0]^3 computational manifold
    const normalizedCoord: SpatialCoordXYZ = {
      x: Number((rawCoord.x / maxBound).toFixed(config.precision)),
      y: Number((rawCoord.y / maxBound).toFixed(config.precision)),
      z: Number((rawCoord.z / maxBound).toFixed(config.precision)),
    };

    // 6. Non-invasive read-only projection to Address 369
    const syncRef = CoreSyncBoundary.projectTo369(rawCoord);

    // 7. Cryptographic hash digest for coordinate state
    const hashData = stateKey + ':' + rawCoord.x + ',' + rawCoord.y + ',' + rawCoord.z + ':' + normalizedCoord.x + ',' + normalizedCoord.y + ',' + normalizedCoord.z;
    const coordinateHash = crypto.createHash('sha256').update(hashData).digest('hex');

    return {
      stateKey,
      rawCoord,
      normalizedCoord,
      bounds,
      precision: config.precision,
      polaritySign: polarity,
      scaleLevel,
      projected369Address: syncRef.address369,
      epistemicStatus: EpistemicStatus.FORMAL_RESEARCH_HYPOTHESIS,
      coordinateHash,
    };
  }

  /**
   * Collision detection within a spatial epsilon neighborhood
   */
  public static detectCollisions(
    coords: XYZStateCoordinates[],
    epsilon: number = 1e-5
  ): { collisionCount: number; collisions: Array<{ a: string; b: string; dist: number }> } {
    const collisions: Array<{ a: string; b: string; dist: number }> = [];

    for (let i = 0; i < coords.length; i++) {
      for (let j = i + 1; j < coords.length; j++) {
        const a = coords[i];
        const b = coords[j];
        if (a.scaleLevel === b.scaleLevel) {
          const dx = a.rawCoord.x - b.rawCoord.x;
          const dy = a.rawCoord.y - b.rawCoord.y;
          const dz = a.rawCoord.z - b.rawCoord.z;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
          if (dist < epsilon) {
            collisions.push({ a: a.stateKey, b: b.stateKey, dist });
          }
        }
      }
    }

    return {
      collisionCount: collisions.length,
      collisions,
    };
  }

  /**
   * Lossless JSON serialization
   */
  public static serialize(item: XYZStateCoordinates): string {
    return JSON.stringify(item);
  }

  /**
   * Exact reconstruction from JSON
   */
  public static reconstruct(jsonStr: string): XYZStateCoordinates {
    const parsed = JSON.parse(jsonStr) as XYZStateCoordinates;
    if (!parsed || !parsed.stateKey || !parsed.rawCoord || !parsed.coordinateHash) {
      throw new Error('Invalid serialized XYZStateCoordinates payload');
    }
    return parsed;
  }
}
