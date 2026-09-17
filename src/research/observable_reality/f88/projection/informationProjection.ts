/**
 * 3D Memory Studio — Funnel 88
 * Projection: Forward Information Projection Pipeline (X → S → O → V → P → D)
 */

import {
  F88SpatialState,
  F88ObserverState,
  F88ProjectionType,
  F88DisplayState,
  F88ObjectDisplayRecord,
} from '../types';
import { calculateInformationMetrics } from '../core/ambiguity';

export function computeF88DisplayChecksum(records: readonly F88ObjectDisplayRecord[]): string {
  let hash = 0x811c9dc5;
  // Compute display checksum based strictly on USER-FACING DISPLAY properties (sx, sy, visible, screenRadius)
  // Non-visible objects contribute only their visibility flag (0) to simulate true information loss
  const str = records
    .map((r) =>
      r.visibleInDisplay
        ? `${r.id}:${r.screenPosition[0].toFixed(1)},${r.screenPosition[1].toFixed(1)}:${r.screenRadius.toFixed(1)}:1`
        : `${r.id}:HIDDEN:0`
    )
    .sort()
    .join('|');

  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function synthesizeInformationDisplay(
  state: F88SpatialState,
  observer: F88ObserverState,
  projectionType: F88ProjectionType,
  width = 800,
  height = 500
): F88DisplayState {
  const [ox, oy, oz] = observer.position;
  const [yawDeg, pitchDeg] = observer.orientation;

  const yaw = (yawDeg * Math.PI) / 180;
  const pitch = (pitchDeg * Math.PI) / 180;
  const cosY = Math.cos(yaw);
  const sinY = Math.sin(yaw);
  const cosP = Math.cos(pitch);
  const sinP = Math.sin(pitch);

  const centerX = width / 2;
  const centerY = height / 2;

  // Step 1: Compute camera space and projection
  const preliminary = state.objects.map((obj) => {
    const [wx = 0, wy = 0, wz = 0] = obj.experimentalWorldPosition;

    const dx = wx - ox;
    const dy = wy - oy;
    const dz = wz - oz;

    const rx = dx * cosY + dz * sinY;
    const rz = -dx * sinY + dz * cosY;

    const ry = dy * cosP - rz * sinP;
    const vz = dy * sinP + rz * cosP;

    const forwardDepth = Math.max(0.1, -vz);
    const distance = Math.hypot(rx, ry, vz) || 0.1;

    let sx: number;
    let sy: number;
    let apparentScale: number;
    let screenRadius: number;

    if (projectionType.includes('ORTHOGRAPHIC')) {
      // Orthographic: completely independent of depth Z!
      sx = centerX + rx * 12;
      sy = centerY - ry * 12;
      apparentScale = observer.zoom;
      screenRadius = Math.max(4, Math.min(20, 8 * observer.zoom));
    } else if (projectionType === 'DIMENSIONAL_PROJECT_Z2_Z1') {
      sx = centerX + rx * 12;
      sy = centerY; // Linear collapse onto horizontal center
      apparentScale = observer.zoom;
      screenRadius = 6;
    } else {
      // Perspective
      const perspectiveFactor = observer.focalLength / Math.max(10, forwardDepth);
      apparentScale = observer.zoom * (observer.focalLength / Math.max(1, distance));
      sx = centerX + rx * perspectiveFactor * (12 / 25);
      sy = centerY - ry * perspectiveFactor * (12 / 25);
      screenRadius = Math.max(4, Math.min(26, 4 + apparentScale * 1.2));
    }

    // FOV & Boundary checks
    let inFrustum = false;
    if (projectionType.includes('ORTHOGRAPHIC')) {
      inFrustum =
        forwardDepth >= observer.nearPlane &&
        forwardDepth <= observer.farPlane &&
        sx >= 0 &&
        sx <= width &&
        sy >= 0 &&
        sy <= height;
    } else {
      const halfHFov = observer.fovDegrees / 2;
      const hAngleDeg = (Math.atan2(Math.abs(rx), forwardDepth) * 180) / Math.PI;
      const vAngleDeg = (Math.atan2(Math.abs(ry), forwardDepth) * 180) / Math.PI;
      inFrustum =
        forwardDepth >= observer.nearPlane &&
        forwardDepth <= observer.farPlane &&
        hAngleDeg <= halfHFov &&
        vAngleDeg <= halfHFov;
    }

    return {
      obj,
      cameraSpacePos: [Number(rx.toFixed(2)), Number(ry.toFixed(2)), Number(vz.toFixed(2))] as [number, number, number],
      depthZ: Number(forwardDepth.toFixed(2)),
      screenPos: [Number(sx.toFixed(1)), Number(sy.toFixed(1))] as [number, number],
      apparentScale: Number(apparentScale.toFixed(2)),
      screenRadius: Number(screenRadius.toFixed(1)),
      inFrustum,
    };
  });

  // Step 2: Occlusion detection
  const sortedCandidates = [...preliminary]
    .filter((p) => p.inFrustum)
    .sort((a, b) => a.depthZ - b.depthZ);

  const records: F88ObjectDisplayRecord[] = preliminary.map((p) => {
    let isOccluded = false;
    let occludedBy: string | null = null;

    if (p.inFrustum) {
      for (const other of sortedCandidates) {
        if (other.obj.id === p.obj.id) break; // Reached self
        const dist = Math.hypot(p.screenPos[0] - other.screenPos[0], p.screenPos[1] - other.screenPos[1]);
        if (dist < 4.0) {
          isOccluded = true;
          occludedBy = other.obj.id;
          break;
        }
      }
    }

    const visibleInDisplay = p.inFrustum && !isOccluded;

    return {
      id: p.obj.id,
      canonicalCoordinate: p.obj.canonicalCoordinate,
      worldPosition: p.obj.experimentalWorldPosition,
      cameraSpacePosition: p.cameraSpacePos,
      projectedPosition: [p.cameraSpacePos[0], p.cameraSpacePos[1], p.depthZ],
      screenPosition: p.screenPos,
      depthZ: p.depthZ,
      apparentScale: p.apparentScale,
      screenRadius: p.screenRadius,
      inFrustum: p.inFrustum,
      isOccluded,
      occludedBy,
      visibleInDisplay,
      color: p.obj.color,
      label: p.obj.label,
    };
  });

  const stateDimension = state.experimentType === 'PROJECTION_COLLAPSE' || state.objects[0].experimentalWorldPosition.length >= 4 ? 4 : 3;
  const metrics = calculateInformationMetrics(records, projectionType, state.objects.length, stateDimension);
  const displayChecksum = computeF88DisplayChecksum(records);
  const displayId = `DISP_F88_${state.experimentType}_${observer.observerId}_${projectionType}`;

  return Object.freeze({
    displayId,
    experimentType: state.experimentType,
    observerId: observer.observerId,
    projectionType,
    objectRecords: Object.freeze(records),
    informationMetrics: metrics,
    width,
    height,
    displayChecksum,
  });
}
