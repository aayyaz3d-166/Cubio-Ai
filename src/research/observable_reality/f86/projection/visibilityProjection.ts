/**
 * 3D Memory Studio — Funnel 86
 * Projection: Full Visibility & Occlusion Synthesis Pipeline
 */

import {
  F86SpatialScene,
  F86ObserverState,
  F86ProjectionType,
  F86DisplayState,
  F86ObjectVisibilityRecord,
  F86OcclusionReport,
  F86VisibilityReason,
} from '../types';
import { evaluateFieldOfView } from '../core/fieldOfView';
import { calculateLineOfSight } from '../core/lineOfSight';
import { evaluateScreenOcclusion } from '../core/occlusion';
import { transformPerspectiveVisibility } from './perspectiveVisibility';
import { transformOrthographicVisibility } from './orthographicVisibility';
import { evaluate4DDimensionalVisibility } from './dimensionalVisibility';

export function computeF86DisplayChecksum(records: readonly F86ObjectVisibilityRecord[]): string {
  let hash = 0x811c9dc5;
  const str = records
    .map(
      (r) =>
        `${r.id}:${r.screenPosition[0].toFixed(1)},${r.screenPosition[1].toFixed(1)}:${r.depthZ.toFixed(1)}:${r.visible ? 1 : 0}:${r.visibilityReason}`
    )
    .sort()
    .join('|');

  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function synthesizeVisibilityDisplay(
  scene: F86SpatialScene,
  observer: F86ObserverState,
  projectionType: F86ProjectionType,
  width = 800,
  height = 500
): F86DisplayState {
  // Step 1: Geometric Transform & FOV evaluation for all objects
  const preliminary = scene.objects.map((obj) => {
    let viewPos: [number, number, number];
    let screenPos: [number, number];
    let screenRadius: number;
    let apparentScale: number;
    let depthZ: number;

    if (projectionType.includes('ORTHOGRAPHIC')) {
      const trans = transformOrthographicVisibility(obj.experimentalWorldPosition, observer, width, height);
      viewPos = trans.viewPos;
      screenPos = trans.screenPos;
      screenRadius = trans.screenRadius;
      apparentScale = trans.apparentScale;
      depthZ = trans.depthZ;
    } else {
      const trans = transformPerspectiveVisibility(obj.experimentalWorldPosition, observer, width, height);
      viewPos = trans.viewPos;
      screenPos = trans.screenPos;
      screenRadius = trans.screenRadius;
      apparentScale = trans.apparentScale;
      depthZ = trans.depthZ;
    }

    const fov = evaluateFieldOfView(viewPos, observer);

    return {
      obj,
      viewPos,
      screenPos,
      screenRadius,
      apparentScale,
      depthZ,
      fov,
    };
  });

  // Step 2: Line of sight and screen-space occlusion
  const occlusionCandidates = preliminary.map((p) => ({
    id: p.obj.id,
    screenPos: p.screenPos,
    radius: p.screenRadius,
    depth: p.depthZ,
    inFrustum: p.fov.inFrustum,
  }));

  const losCandidates = preliminary.map((p) => ({
    id: p.obj.id,
    pos: p.obj.experimentalWorldPosition,
    radius: 3.0,
  }));

  const occluderPairs: [string, string][] = [];
  let totalOccluded = 0;
  let totalVisible = 0;
  let totalOutsideFov = 0;
  let totalBehindObserver = 0;

  const records: F86ObjectVisibilityRecord[] = preliminary.map((p) => {
    const los = calculateLineOfSight(observer, p.obj.id, p.obj.experimentalWorldPosition, losCandidates);
    const occ = evaluateScreenOcclusion(
      p.obj.id,
      p.screenPos,
      p.screenRadius,
      p.depthZ,
      occlusionCandidates
    );

    let visible = p.fov.inFrustum;
    let reason: F86VisibilityReason = p.fov.reason;

    if (p.fov.behindObserver) {
      visible = false;
      reason = 'BEHIND_OBSERVER';
      totalBehindObserver++;
    } else if (!p.fov.inFrustum) {
      visible = false;
      reason = p.fov.reason;
      totalOutsideFov++;
    } else if (occ.occluded) {
      visible = false;
      reason = 'OCCLUDED';
      totalOccluded++;
      if (occ.occludedBy) {
        occluderPairs.push([occ.occludedBy, p.obj.id]);
      }
    } else if (occ.reason === 'PARTIALLY_OCCLUDED') {
      visible = true;
      reason = 'PARTIALLY_OCCLUDED';
      totalVisible++;
    } else {
      visible = true;
      reason = 'VISIBLE';
      totalVisible++;
    }

    // 4D slice filtering if in DIMENSIONAL_SLICE_Z4_Z3
    if (projectionType === 'DIMENSIONAL_SLICE_Z4_Z3') {
      const dim4 = evaluate4DDimensionalVisibility(p.obj.experimentalWorldPosition, 0, 15);
      if (!dim4.isWithin4DSlice) {
        visible = false;
        reason = 'OUTSIDE_FOV';
      }
    }

    return {
      id: p.obj.id,
      canonicalCoordinate: p.obj.canonicalCoordinate,
      worldPosition: p.obj.experimentalWorldPosition,
      cameraSpacePosition: p.viewPos,
      projectedPosition: [p.viewPos[0], p.viewPos[1], p.viewPos[2]],
      screenPosition: p.screenPos,
      depthZ: p.depthZ,
      apparentScale: p.apparentScale,
      screenRadius: p.screenRadius,
      inFrustum: p.fov.inFrustum,
      behindObserver: p.fov.behindObserver,
      lineOfSight: los.lineOfSight,
      occluded: occ.occluded,
      occludedBy: occ.occludedBy,
      depthRank: occ.depthRank,
      visibleFraction: occ.visibleFraction,
      occludedFraction: occ.occludedFraction,
      visible,
      visibilityReason: reason,
      color: p.obj.color,
      label: p.obj.label,
    };
  });

  const occlusionReport: F86OcclusionReport = Object.freeze({
    occluderPairs: Object.freeze(occluderPairs),
    totalOccluded,
    totalVisible,
    totalOutsideFov,
    totalBehindObserver,
  });

  const displayChecksum = computeF86DisplayChecksum(records);
  const displayId = `DISP_F86_${scene.sceneType}_${observer.observerId}_${projectionType}`;

  return Object.freeze({
    displayId,
    sceneType: scene.sceneType,
    observerId: observer.observerId,
    projectionType,
    objectRecords: Object.freeze(records),
    occlusionReport,
    width,
    height,
    displayChecksum,
  });
}
