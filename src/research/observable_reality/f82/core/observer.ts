/**
 * 3D Memory Studio — Funnel 82
 * Observer Configuration Model
 */

import { Observer, Coordinate3D, F82ProjectionType, ObservationBoundary } from '../types';
import { createDefaultObservationBoundary } from './observationBoundary';

export function createF82Observer(
  observerId: string,
  position: Coordinate3D = [0, 0, 0],
  orientation: Coordinate3D = [0, 0, 1],
  projectionType: F82ProjectionType = 'DIRECT_ORTHOGRAPHIC_3D',
  boundary?: ObservationBoundary,
  options: Partial<{
    dimension: number;
    fovDegrees: number;
    focalLength: number;
    sliceW: number;
    sliceThickness: number;
  }> = {}
): Observer {
  if (!observerId || observerId.trim() === '') {
    throw new Error('Observer observerId cannot be empty');
  }

  const observationBoundary = boundary || createDefaultObservationBoundary();

  return Object.freeze({
    observerId,
    dimension: options.dimension || 3,
    position: Object.freeze([...position]) as unknown as Coordinate3D,
    orientation: Object.freeze([...orientation]) as unknown as Coordinate3D,
    projectionType,
    observationBoundary,
    fovDegrees: options.fovDegrees || 60,
    focalLength: options.focalLength || 10.0,
    sliceW: options.sliceW !== undefined ? options.sliceW : 0.0,
    sliceThickness: options.sliceThickness !== undefined ? options.sliceThickness : 1.0,
  });
}
