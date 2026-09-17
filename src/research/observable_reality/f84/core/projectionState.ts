/**
 * 3D Memory Studio — Funnel 84
 * Core: Projection State Definitions (P)
 */

import { ProjectionState, F84ProjectionType } from '../types';
import { computeFNVHash } from './observationState';

export function createProjectionState(
  projectionType: F84ProjectionType,
  sourceDimension = 3,
  targetDimension = 2,
  options: {
    focalLength?: number;
    sliceW?: number;
    sliceThickness?: number;
    parameters?: Record<string, unknown>;
  } = {}
): ProjectionState {
  const focalLength = options.focalLength ?? 500;
  const projectionId = `PROJ_${projectionType}_${sourceDimension}D_${targetDimension}D`;

  return Object.freeze({
    projectionId,
    projectionType,
    sourceDimension,
    targetDimension,
    sliceW: options.sliceW ?? 0,
    sliceThickness: options.sliceThickness ?? 10,
    focalLength,
    parameters: Object.freeze({ ...options.parameters }),
  });
}

export function computeProjectionChecksum(proj: ProjectionState): string {
  return computeFNVHash(
    `${proj.projectionId}:${proj.projectionType}:${proj.sourceDimension}:${proj.targetDimension}:${proj.focalLength}:${proj.sliceW ?? 0}`
  );
}
