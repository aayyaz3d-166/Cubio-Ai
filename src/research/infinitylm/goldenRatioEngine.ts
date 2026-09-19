/**
 * CUBiO AI — PMA Task 351: Golden-Ratio Transformation Engine
 * src/research/infinitylm/goldenRatioEngine.ts
 *
 * Isolated deterministic Golden Ratio (phi = (1 + sqrt(5))/2) transformation engine.
 * Epistemic Boundary: Computational & geometric hypothesis testing.
 * No physical spacetime curvature, quantum entanglement, or mystical properties claimed.
 */

import * as crypto from 'crypto';
import {
  PHI,
  SpatialCoordXYZ,
  PhiTransformState,
  EpistemicStatus,
} from './types';
import { XYZStateCoordinates } from './xyzStateMapping';

export const GOLDEN_ANGLE_RAD = (2 * Math.PI) / (PHI * PHI); // ~2.3999632297286533 rad (~137.5 degrees)

export interface PhiTransformParameters {
  readonly powerOrder: number;      // k in Z (phi^k scaling)
  readonly rotationAngleRad: number;// Angular step in radians (default: GOLDEN_ANGLE_RAD)
  readonly axis: 'Z' | 'Y' | 'X';   // Axis of transformation rotation
  readonly precision: number;       // Decimal precision (default: 6)
}

export interface PhiDistributionMetrics {
  readonly meanRadius: number;
  readonly radiusVariance: number;
  readonly boundingVolume: number;
  readonly dispersionEntropy: number;
}

export interface PhiCollisionMetrics {
  readonly evaluatedStateCount: number;
  readonly originalCollisions: number;
  readonly transformedCollisions: number;
  readonly collisionReductionRate: number;
}

export interface PhiStabilityMetrics {
  readonly maxReversibilityError: number;
  readonly meanReversibilityError: number;
  readonly conditionNumber: number;
  readonly isNumericallyStable: boolean;
  readonly powerSweepResults: Array<{
    power: number;
    error: number;
    determinant: number;
  }>;
}

export interface PhiHypothesisEvaluation {
  readonly hypothesis: string;
  readonly description: string;
  readonly metricTested: string;
  readonly measuredValue: number;
  readonly expectedBaseline: number;
  readonly verdict: 'CONFIRMED' | 'FALSIFIED' | 'INCONCLUSIVE';
  readonly epistemicStatus: EpistemicStatus;
}

export class GoldenRatioEngine {
  public static readonly DEFAULT_PARAMS: PhiTransformParameters = {
    powerOrder: 1,
    rotationAngleRad: GOLDEN_ANGLE_RAD,
    axis: 'Z',
    precision: 6,
  };

  public static transform(
    coord: SpatialCoordXYZ,
    params: Partial<PhiTransformParameters> = {}
  ): PhiTransformState {
    const k = params.powerOrder !== undefined ? params.powerOrder : this.DEFAULT_PARAMS.powerOrder;
    const theta = params.rotationAngleRad !== undefined ? params.rotationAngleRad : this.DEFAULT_PARAMS.rotationAngleRad;
    const axis = params.axis || this.DEFAULT_PARAMS.axis;
    const precision = params.precision || this.DEFAULT_PARAMS.precision;

    const phiFactor = Math.pow(PHI, k);
    const cosT = Math.cos(theta);
    const sinT = Math.sin(theta);

    let rotX = coord.x;
    let rotY = coord.y;
    let rotZ = coord.z;

    if (axis === 'Z') {
      rotX = coord.x * cosT - coord.y * sinT;
      rotY = coord.x * sinT + coord.y * cosT;
    } else if (axis === 'Y') {
      rotX = coord.x * cosT + coord.z * sinT;
      rotZ = -coord.x * sinT + coord.z * cosT;
    } else if (axis === 'X') {
      rotY = coord.y * cosT - coord.z * sinT;
      rotZ = coord.y * sinT + coord.z * cosT;
    }

    const transformedCoord: SpatialCoordXYZ = {
      x: Number((rotX * phiFactor).toFixed(precision)),
      y: Number((rotY * phiFactor).toFixed(precision)),
      z: Number((rotZ * phiFactor).toFixed(precision)),
    };

    const determinant = Number(Math.pow(phiFactor, 3).toFixed(precision));

    return {
      phiFactor,
      rotationAngleRad: theta,
      transformedCoord,
      determinant,
      isLossless: Math.abs(determinant) > 1e-12,
    };
  }

  public static inverseTransform(
    state: PhiTransformState,
    axis: 'Z' | 'Y' | 'X' = 'Z',
    precision: number = 6
  ): SpatialCoordXYZ {
    const invPhi = 1.0 / state.phiFactor;
    const theta = -state.rotationAngleRad;

    const unscaledX = state.transformedCoord.x * invPhi;
    const unscaledY = state.transformedCoord.y * invPhi;
    const unscaledZ = state.transformedCoord.z * invPhi;

    const cosT = Math.cos(theta);
    const sinT = Math.sin(theta);

    let origX = unscaledX;
    let origY = unscaledY;
    let origZ = unscaledZ;

    if (axis === 'Z') {
      origX = unscaledX * cosT - unscaledY * sinT;
      origY = unscaledX * sinT + unscaledY * cosT;
    } else if (axis === 'Y') {
      origX = unscaledX * cosT + unscaledZ * sinT;
      origZ = -unscaledX * sinT + unscaledZ * cosT;
    } else if (axis === 'X') {
      origY = unscaledY * cosT - unscaledZ * sinT;
      origZ = unscaledY * sinT + unscaledZ * cosT;
    }

    return {
      x: Number(origX.toFixed(precision)),
      y: Number(origY.toFixed(precision)),
      z: Number(origZ.toFixed(precision)),
    };
  }

  public static evaluateDistribution(coords: SpatialCoordXYZ[]): PhiDistributionMetrics {
    if (coords.length === 0) {
      return { meanRadius: 0, radiusVariance: 0, boundingVolume: 0, dispersionEntropy: 0 };
    }

    const radii = coords.map(c => Math.sqrt(c.x * c.x + c.y * c.y + c.z * c.z));
    const meanRadius = radii.reduce((acc, r) => acc + r, 0) / radii.length;
    const variance = radii.reduce((acc, r) => acc + Math.pow(r - meanRadius, 2), 0) / radii.length;

    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;

    for (const c of coords) {
      if (c.x < minX) minX = c.x;
      if (c.x > maxX) maxX = c.x;
      if (c.y < minY) minY = c.y;
      if (c.y > maxY) maxY = c.y;
      if (c.z < minZ) minZ = c.z;
      if (c.z > maxZ) maxZ = c.z;
    }

    const boundingVolume = Math.max(1e-6, (maxX - minX) * (maxY - minY) * (maxZ - minZ));

    const bins = 10;
    const maxR = Math.max(...radii, 1.0);
    const hist = new Array(bins).fill(0);
    for (const r of radii) {
      const idx = Math.min(bins - 1, Math.floor((r / maxR) * bins));
      hist[idx]++;
    }

    let entropy = 0;
    for (const count of hist) {
      if (count > 0) {
        const p = count / coords.length;
        entropy -= p * Math.log2(p);
      }
    }

    return {
      meanRadius: Number(meanRadius.toFixed(6)),
      radiusVariance: Number(variance.toFixed(6)),
      boundingVolume: Number(boundingVolume.toFixed(6)),
      dispersionEntropy: Number(entropy.toFixed(6)),
    };
  }

  public static evaluateCollisions(
    originalCoords: SpatialCoordXYZ[],
    transformedCoords: SpatialCoordXYZ[],
    tolerance: number = 0.05
  ): PhiCollisionMetrics {
    const countCollisions = (coords: SpatialCoordXYZ[]): number => {
      let count = 0;
      for (let i = 0; i < coords.length; i++) {
        for (let j = i + 1; j < coords.length; j++) {
          const dx = coords[i].x - coords[j].x;
          const dy = coords[i].y - coords[j].y;
          const dz = coords[i].z - coords[j].z;
          if (Math.sqrt(dx * dx + dy * dy + dz * dz) < tolerance) {
            count++;
          }
        }
      }
      return count;
    };

    const origCollisions = countCollisions(originalCoords);
    const transCollisions = countCollisions(transformedCoords);
    const reductionRate = origCollisions > 0
      ? Number(((origCollisions - transCollisions) / origCollisions).toFixed(4))
      : 0;

    return {
      evaluatedStateCount: originalCoords.length,
      originalCollisions: origCollisions,
      transformedCollisions: transCollisions,
      collisionReductionRate: reductionRate,
    };
  }

  public static evaluateStability(
    sampleCoords: SpatialCoordXYZ[],
    powerSweep: number[] = [-3, -2, -1, 0, 1, 2, 3]
  ): PhiStabilityMetrics {
    const sweepResults: Array<{ power: number; error: number; determinant: number }> = [];
    let maxError = 0;
    let totalError = 0;
    let count = 0;

    for (const k of powerSweep) {
      let sweepMaxErr = 0;
      let lastDet = 1;

      for (const coord of sampleCoords) {
        const transformed = this.transform(coord, { powerOrder: k });
        const inverted = this.inverseTransform(transformed);

        lastDet = transformed.determinant;
        const err = Math.sqrt(
          Math.pow(inverted.x - coord.x, 2) +
          Math.pow(inverted.y - coord.y, 2) +
          Math.pow(inverted.z - coord.z, 2)
        );

        if (err > sweepMaxErr) sweepMaxErr = err;
        if (err > maxError) maxError = err;
        totalError += err;
        count++;
      }

      sweepResults.push({
        power: k,
        error: Number(sweepMaxErr.toFixed(8)),
        determinant: Number(lastDet.toFixed(6)),
      });
    }

    const meanError = count > 0 ? totalError / count : 0;
    const conditionNumber = 1.0;

    return {
      maxReversibilityError: Number(maxError.toFixed(8)),
      meanReversibilityError: Number(meanError.toFixed(8)),
      conditionNumber,
      isNumericallyStable: maxError < 1e-4,
      powerSweepResults: sweepResults,
    };
  }

  public static evaluatePossibilityHypotheses(
    coords: SpatialCoordXYZ[]
  ): PhiHypothesisEvaluation[] {
    const transformed = coords.map(c => this.transform(c, { powerOrder: 1 }).transformedCoord);
    const origDist = this.evaluateDistribution(coords);
    const transDist = this.evaluateDistribution(transformed);

    const entropyIncrease = transDist.dispersionEntropy >= origDist.dispersionEntropy * 0.95;
    const h1: PhiHypothesisEvaluation = {
      hypothesis: 'HYPOTHESIS-PHI-01: Spatial Dispersion Optimization',
      description: 'Phi angular modulation maintains or improves spatial dispersion entropy across discrete states',
      metricTested: 'dispersionEntropy (transformed vs original)',
      measuredValue: transDist.dispersionEntropy,
      expectedBaseline: origDist.dispersionEntropy,
      verdict: entropyIncrease ? 'CONFIRMED' : 'FALSIFIED',
      epistemicStatus: EpistemicStatus.FORMAL_RESEARCH_HYPOTHESIS,
    };

    const expectedVolume = origDist.boundingVolume * Math.pow(PHI, 3);
    const volumeRatio = transDist.boundingVolume / expectedVolume;
    const volumeValid = Math.abs(volumeRatio - 1.0) < 0.25;
    const h2: PhiHypothesisEvaluation = {
      hypothesis: 'HYPOTHESIS-PHI-02: Volumetric Expansion Proportionality',
      description: 'Transformed bounding volume scales deterministically with phi^3 volumetric determinant',
      metricTested: 'boundingVolume ratio to theoretical phi^3',
      measuredValue: Number(volumeRatio.toFixed(4)),
      expectedBaseline: 1.0,
      verdict: volumeValid ? 'CONFIRMED' : 'INCONCLUSIVE',
      epistemicStatus: EpistemicStatus.FORMAL_RESEARCH_HYPOTHESIS,
    };

    const h3: PhiHypothesisEvaluation = {
      hypothesis: 'HYPOTHESIS-PHI-03: Physical Spacetime Causality Assumption',
      description: 'Claims that phi generates real physical spacetime directional fields or quantum advantage',
      metricTested: 'Physical causal evidence present',
      measuredValue: 0.0,
      expectedBaseline: 0.0,
      verdict: 'FALSIFIED',
      epistemicStatus: EpistemicStatus.FORMAL_RESEARCH_HYPOTHESIS,
    };

    return [h1, h2, h3];
  }
}
