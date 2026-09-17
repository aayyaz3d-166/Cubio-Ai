/**
 * 3D Memory Studio — Funnel 83
 * Observer Frame Transformation Engine (Translating / Rotating observer frame)
 */

import { ObserverFrameConfig } from '../types';
import { Coordinate3D, F82ProjectionType } from '../../f82/types';
import { createObserverFrame } from '../core/observerFrame';

export function translateObserverFrame(
  source: ObserverFrameConfig,
  deltaPosition: Coordinate3D,
  newFrameId?: string
): ObserverFrameConfig {
  const newPos: Coordinate3D = [
    Number((source.position[0] + deltaPosition[0]).toFixed(4)),
    Number((source.position[1] + deltaPosition[1]).toFixed(4)),
    Number((source.position[2] + deltaPosition[2]).toFixed(4)),
  ];

  return createObserverFrame(
    newFrameId || source.frameId + '_TRANS',
    source.observerId,
    newPos,
    source.orientation,
    source.projectionType,
    source.observationBoundary,
    {
      fovDegrees: source.fovDegrees,
      focalLength: source.focalLength,
      sliceW: source.sliceW,
      sliceThickness: source.sliceThickness,
      frameMetadata: source.frameMetadata,
    }
  );
}

export function switchProjectionType(
  source: ObserverFrameConfig,
  newProjectionType: F82ProjectionType,
  newFrameId?: string
): ObserverFrameConfig {
  return createObserverFrame(
    newFrameId || source.frameId + '_' + newProjectionType,
    source.observerId,
    source.position,
    source.orientation,
    newProjectionType,
    source.observationBoundary,
    {
      fovDegrees: source.fovDegrees,
      focalLength: source.focalLength,
      sliceW: source.sliceW,
      sliceThickness: source.sliceThickness,
      frameMetadata: source.frameMetadata,
    }
  );
}
