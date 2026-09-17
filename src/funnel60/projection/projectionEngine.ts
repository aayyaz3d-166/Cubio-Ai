/**
 * 3D Memory Studio — Funnel 60
 * Deterministic Projection Engine
 *
 * Mathematically projects N-dimensional computational coordinates into 3D GPU world space.
 */

import { ProjectionType, DimensionId } from '../types';
import { SimulationDimension } from '../../funnel52/types';
import { clamp3DPosition, sanitizeRawCoordinateValues } from '../transform/coordinateNormalizer';

export function projectNDimensionalCoordinate(
  rawValues: readonly number[],
  dimNumber: SimulationDimension,
  projectionType: ProjectionType = 'DIRECT'
): [number, number, number] {
  const { sanitized } = sanitizeRawCoordinateValues(rawValues);
  const n = sanitized.length;

  if (dimNumber === 3 || projectionType === 'DIRECT') {
    const x = sanitized[0] ?? 0;
    const y = sanitized[1] ?? 0;
    const z = sanitized[2] ?? 0;
    return clamp3DPosition([x, y, z]);
  }

  switch (projectionType) {
    case 'ORTHOGRAPHIC': {
      const x = sanitized[0] ?? 0;
      const y = sanitized[1] ?? 0;
      const z = sanitized[2] ?? 0;
      return clamp3DPosition([x, y, z]);
    }

    case 'RADIAL': {
      // Euclidean norm & angular dispersion across higher axes
      let normSq = 0;
      let angleTheta = 0;
      let anglePhi = 0;

      for (let i = 0; i < n; i++) {
        normSq += sanitized[i] * sanitized[i];
        angleTheta += (i + 1) * sanitized[i];
        anglePhi += ((i % 2 === 0 ? 1 : -1) * sanitized[i]);
      }

      const radius = Math.min(350, Math.sqrt(normSq));
      const theta = (angleTheta * 0.05) % (2 * Math.PI);
      const phi = (anglePhi * 0.05) % Math.PI;

      const px = radius * Math.sin(phi) * Math.cos(theta);
      const py = radius * Math.cos(phi) * 0.5;
      const pz = radius * Math.sin(phi) * Math.sin(theta);

      return clamp3DPosition([px, py, pz]);
    }

    case 'LAYER': {
      const x = sanitized[0] ?? 0;
      const z = sanitized[2] ?? (sanitized[1] ?? 0);
      let layerSum = 0;
      for (let i = 3; i < n; i++) {
        layerSum += sanitized[i];
      }
      const y = (sanitized[1] ?? 0) + (n > 3 ? layerSum / (n - 3) : 0);
      return clamp3DPosition([x, y, z]);
    }

    case 'PAIRWISE': {
      let px = 0;
      let py = 0;
      let pz = 0;

      for (let i = 0; i < n; i++) {
        const weight = 1.0 / (Math.floor(i / 3) + 1);
        if (i % 3 === 0) px += sanitized[i] * weight;
        else if (i % 3 === 1) py += sanitized[i] * weight;
        else pz += sanitized[i] * weight;
      }

      return clamp3DPosition([px, py, pz]);
    }

    case 'AXIS_SLICING': {
      const x = sanitized[0] ?? 0;
      const y = sanitized[Math.min(3, n - 1)] ?? 0;
      const z = sanitized[Math.min(n - 1, 7)] ?? 0;
      return clamp3DPosition([x, y, z]);
    }

    case 'CLAMPED':
    default: {
      const x = sanitized[0] ?? 0;
      const y = sanitized[1] ?? 0;
      const z = sanitized[2] ?? 0;
      return clamp3DPosition([x, y, z], -200, 200);
    }
  }
}
