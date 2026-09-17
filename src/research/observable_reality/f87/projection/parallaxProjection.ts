/**
 * 3D Memory Studio — Funnel 87
 * Projection: Full Parallax Synthesis Pipeline
 */

import {
  F87SpatialState,
  F87ObserverState,
  F87ProjectionType,
  F87DisplayState,
  F87ObjectRenderRecord,
} from '../types';
import { calculateRelativeGeometry } from '../core/relativeGeometry';
import { calculateDepthRanking } from '../core/depthOrdering';
import { calculateParallaxMeasurement } from '../core/parallaxCalculator';
import { projectPerspectiveParallax } from './perspectiveParallax';
import { projectOrthographicParallax } from './orthographicParallax';
import { evaluate4DParallaxProjection } from './dimensionalParallax';

export function computeF87DisplayChecksum(records: readonly F87ObjectRenderRecord[]): string {
  let hash = 0x811c9dc5;
  const str = records
    .map(
      (r) =>
        `${r.id}:${r.screenPosition[0].toFixed(1)},${r.screenPosition[1].toFixed(1)}:${r.depthZ.toFixed(1)}:${r.apparentScale.toFixed(2)}:${r.depthRank}`
    )
    .sort()
    .join('|');

  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function synthesizeParallaxDisplay(
  state: F87SpatialState,
  observer: F87ObserverState,
  projectionType: F87ProjectionType,
  baselineDisplay?: F87DisplayState | null,
  width = 800,
  height = 500
): F87DisplayState {
  const preliminary = state.objects.map((obj) => {
    const geom = calculateRelativeGeometry(obj.experimentalWorldPosition, observer);

    let proj: {
      projectedPos: [number, number, number];
      screenPos: [number, number];
      screenRadius: number;
      apparentScale: number;
      visible: boolean;
    };

    if (projectionType.includes('ORTHOGRAPHIC')) {
      proj = projectOrthographicParallax(geom.cameraSpacePos, observer, width, height);
    } else {
      proj = projectPerspectiveParallax(geom.cameraSpacePos, observer, width, height);
    }

    // 4D slice handling
    if (projectionType === 'DIMENSIONAL_SLICE_Z4_Z3') {
      const dim4 = evaluate4DParallaxProjection(obj.experimentalWorldPosition, 0, 15);
      if (!dim4.isWithinSlice) {
        proj.visible = false;
      }
    }

    return {
      obj,
      geom,
      proj,
    };
  });

  const depthItems = preliminary.map((p) => ({ id: p.obj.id, depthZ: p.geom.depthZ }));
  const { sortedIds, depthRankMap } = calculateDepthRanking(depthItems);

  const records: F87ObjectRenderRecord[] = preliminary.map((p) => ({
    id: p.obj.id,
    canonicalCoordinate: p.obj.canonicalCoordinate,
    worldPosition: p.obj.experimentalWorldPosition,
    relativeVector: p.geom.relativeVector,
    cameraSpacePosition: p.geom.cameraSpacePos,
    projectedPosition: p.proj.projectedPos,
    screenPosition: p.proj.screenPos,
    depthZ: p.geom.depthZ,
    apparentScale: p.proj.apparentScale,
    screenRadius: p.proj.screenRadius,
    visible: p.proj.visible,
    depthRank: depthRankMap[p.obj.id] ?? 1,
    color: p.obj.color,
    label: p.obj.label,
  }));

  const parallaxMeasurement = calculateParallaxMeasurement(
    records,
    baselineDisplay ? baselineDisplay.objectRecords : null
  );

  const displayChecksum = computeF87DisplayChecksum(records);
  const displayId = `DISP_F87_${state.experimentType}_${observer.observerId}_${projectionType}`;

  return Object.freeze({
    displayId,
    experimentType: state.experimentType,
    observerId: observer.observerId,
    projectionType,
    objectRecords: Object.freeze(records),
    parallaxMeasurement,
    sortedDepthIds: sortedIds,
    width,
    height,
    displayChecksum,
  });
}
