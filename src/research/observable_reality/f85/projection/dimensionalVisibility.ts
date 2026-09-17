/**
 * 3D Memory Studio — Funnel 85
 * Projection: Full Dimensional Visibility Engine
 */

import {
  F85SpatialConfiguration,
  F85ObserverState,
  F85ProjectionType,
  F85DisplayState,
  F85ObjectViewRecord,
} from '../types';
import { transformWorldToView } from './worldToView';
import { transformViewToProjection } from './viewToProjection';
import { transformProjectionToScreen } from './projectionToScreen';
import { evaluateDistinguishability } from '../core/distinguishability';

export function computeDisplayChecksum(records: readonly F85ObjectViewRecord[]): string {
  let hash = 0x811c9dc5;
  const str = records
    .map(
      (r) =>
        `${r.id}:${r.screenPosition[0].toFixed(2)},${r.screenPosition[1].toFixed(2)}:${r.depthZ.toFixed(2)}:${r.screenRadius.toFixed(2)}:${r.apparentScale.toFixed(2)}:${r.visible ? 1 : 0}`
    )
    .sort()
    .join('|');

  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function synthesizeSpatialDisplay(
  config: F85SpatialConfiguration,
  observer: F85ObserverState,
  projectionType: F85ProjectionType,
  width = 800,
  height = 500
): F85DisplayState {
  const records: F85ObjectViewRecord[] = config.objects.map((obj) => {
    const wCoord = obj.experimentalWorldPosition[3] ?? 0;
    const { viewPos, distance, apparentScale } = transformWorldToView(obj.experimentalWorldPosition, observer);
    const { projectedPos, visible: projVisible } = transformViewToProjection(
      viewPos,
      projectionType,
      observer.focalLength,
      wCoord
    );
    const effectiveScale = projectionType.includes('ORTHOGRAPHIC') ? observer.zoom : apparentScale;
    const { screenPos, screenRadius, inFrustum } = transformProjectionToScreen(
      projectedPos,
      effectiveScale,
      width,
      height
    );

    return {
      id: obj.id,
      canonicalCoordinate: obj.canonicalCoordinate,
      worldPosition: obj.experimentalWorldPosition,
      observerRelativePosition: viewPos,
      projectedPosition: projectedPos,
      screenPosition: screenPos,
      screenRadius,
      depthZ: viewPos[2],
      apparentScale,
      visible: projVisible,
      inFrustum,
      color: obj.color,
      label: obj.label,
    };
  });

  const collisionReport = evaluateDistinguishability(records, 16);
  const displayChecksum = computeDisplayChecksum(records);
  const displayId = `DISP_${config.experimentType}_${observer.observerId}_${projectionType}`;

  return Object.freeze({
    displayId,
    experimentType: config.experimentType,
    observerId: observer.observerId,
    projectionType,
    objectRecords: Object.freeze(records),
    collisionReport,
    width,
    height,
    displayChecksum,
  });
}
