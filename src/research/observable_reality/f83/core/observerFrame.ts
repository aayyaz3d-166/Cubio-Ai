/**
 * 3D Memory Studio — Funnel 83
 * Observer Frame Model & Builder
 */

import { ObserverFrameConfig } from '../types';
import { Coordinate3D, F82ProjectionType, ObservationBoundary, Observer } from '../../f82/types';
import { createDefaultObservationBoundary } from '../../f82/core/observationBoundary';
import { createF82Observer } from '../../f82/core/observer';

export function createObserverFrame(
  frameId: string,
  observerId: string,
  position: Coordinate3D = [0, 0, 0],
  orientation: Coordinate3D = [0, 0, 1],
  projectionType: F82ProjectionType = 'DIRECT_ORTHOGRAPHIC_3D',
  boundary?: ObservationBoundary,
  options: Partial<{
    fovDegrees: number;
    focalLength: number;
    sliceW: number;
    sliceThickness: number;
    frameMetadata: Readonly<Record<string, unknown>>;
  }> = {}
): ObserverFrameConfig {
  if (!frameId || frameId.trim() === '') {
    throw new Error('ObserverFrame frameId cannot be empty');
  }
  if (!observerId || observerId.trim() === '') {
    throw new Error('ObserverFrame observerId cannot be empty');
  }

  const observationBoundary = boundary || createDefaultObservationBoundary();

  return Object.freeze({
    frameId,
    observerId,
    position: Object.freeze([...position]) as unknown as Coordinate3D,
    orientation: Object.freeze([...orientation]) as unknown as Coordinate3D,
    projectionType,
    observationBoundary,
    fovDegrees: options.fovDegrees ?? 60,
    focalLength: options.focalLength ?? 10.0,
    sliceW: options.sliceW ?? 0.0,
    sliceThickness: options.sliceThickness ?? 1.0,
    frameMetadata: Object.freeze({ ...(options.frameMetadata || {}) }),
  });
}

export function toF82Observer(frameConfig: ObserverFrameConfig): Observer {
  return createF82Observer(
    frameConfig.observerId,
    frameConfig.position,
    frameConfig.orientation,
    frameConfig.projectionType,
    frameConfig.observationBoundary,
    {
      fovDegrees: frameConfig.fovDegrees,
      focalLength: frameConfig.focalLength,
      sliceW: frameConfig.sliceW,
      sliceThickness: frameConfig.sliceThickness,
    }
  );
}
