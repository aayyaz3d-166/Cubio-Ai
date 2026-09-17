/**
 * 3D Memory Studio — Funnel 57
 * Geometry Quality & LOD Policy
 */

import { GeometryQualityLevel } from '../types';

export interface QualityConfig {
  readonly stateLod: 'LOD_HIGH' | 'LOD_MED' | 'LOD_LOW';
  readonly coreSphereSegments: number;
  readonly clusterRingSegments: number;
  readonly maxParticles: number;
}

export function getQualityConfig(level: GeometryQualityLevel): QualityConfig {
  switch (level) {
    case 'HIGH':
      return Object.freeze({
        stateLod: 'LOD_HIGH',
        coreSphereSegments: 32,
        clusterRingSegments: 64,
        maxParticles: 100,
      });
    case 'MEDIUM':
    case 'AUTO':
      return Object.freeze({
        stateLod: 'LOD_MED',
        coreSphereSegments: 24,
        clusterRingSegments: 48,
        maxParticles: 48,
      });
    case 'LOW':
    default:
      return Object.freeze({
        stateLod: 'LOD_LOW',
        coreSphereSegments: 16,
        clusterRingSegments: 32,
        maxParticles: 20,
      });
  }
}
