/**
 * 3D Memory Studio — Phase 5: Observation & Reconstruction
 * Funnel P5.2: Multi-Observer Generator & Projection Pipeline
 *
 * Defines observers O0, O1, O2 with diverse viewpoints,
 * generates observable frames F0, F1, F2 across dimensions Z3, Z2, Z1,
 * and builds multi-observer sets {F0}, {F0, F1}, {F0, F2}, {F1, F2}, {F0, F1, F2}.
 */

import {
  UnderlyingState,
  ObserverFrame,
  ObservableFrame,
  ProjectedObject,
  SimulationDimension,
} from './types';
import { simpleHash } from './experimentState';

export function calculateOrbitPosition(
  target: readonly [number, number, number],
  yaw: number,
  pitch: number,
  distance: number
): [number, number, number] {
  const pitchRad = (pitch * Math.PI) / 180;
  const yawRad = (yaw * Math.PI) / 180;
  const px = target[0] + distance * Math.cos(pitchRad) * Math.sin(yawRad);
  const py = target[1] + distance * Math.sin(pitchRad);
  const pz = target[2] + distance * Math.cos(pitchRad) * Math.cos(yawRad);
  return [
    Number(px.toFixed(3)),
    Number(py.toFixed(3)),
    Number(pz.toFixed(3)),
  ];
}

function computeFrameHash(frame: Omit<ObserverFrame, 'frameHash'>): string {
  const data = JSON.stringify({
    pos: frame.position,
    tgt: frame.target,
    up: frame.up,
    yaw: frame.yaw,
    pitch: frame.pitch,
    dist: frame.distance,
    fov: frame.fov,
    dim: frame.dimension,
    w: frame.viewportWidth,
    h: frame.viewportHeight,
  });
  return simpleHash(data);
}

export function createObserverO0(
  dimension: SimulationDimension = 3,
  vpW = 640,
  vpH = 480
): ObserverFrame {
  const partial = {
    observerId: 'P52_OBSERVER_O0',
    label: 'O0 (Baseline Front View)',
    position: [0, 20, 260] as const,
    target: [5, 3, 6] as const,
    up: [0, 1, 0] as const,
    yaw: 0,
    pitch: 5,
    distance: 260,
    fov: 60,
    dimension,
    viewportWidth: vpW,
    viewportHeight: vpH,
  };
  return Object.freeze({ ...partial, frameHash: computeFrameHash(partial) });
}

export function createObserverO1(
  dimension: SimulationDimension = 3,
  vpW = 640,
  vpH = 480
): ObserverFrame {
  const partial = {
    observerId: 'P52_OBSERVER_O1',
    label: 'O1 (Side 90° Orthogonal View)',
    position: [260, 20, 6] as const, // Looking along X axis towards Z
    target: [5, 3, 6] as const,
    up: [0, 1, 0] as const,
    yaw: 90,
    pitch: 5,
    distance: 260,
    fov: 60,
    dimension,
    viewportWidth: vpW,
    viewportHeight: vpH,
  };
  return Object.freeze({ ...partial, frameHash: computeFrameHash(partial) });
}

export function createObserverO2(
  dimension: SimulationDimension = 3,
  vpW = 640,
  vpH = 480
): ObserverFrame {
  const partial = {
    observerId: 'P52_OBSERVER_O2',
    label: 'O2 (Top-Down Angled View)',
    position: [0, 260, 6] as const, // Looking down along Y axis
    target: [5, 3, 6] as const,
    up: [0, 0, -1] as const,
    yaw: 0,
    pitch: 85,
    distance: 260,
    fov: 60,
    dimension,
    viewportWidth: vpW,
    viewportHeight: vpH,
  };
  return Object.freeze({ ...partial, frameHash: computeFrameHash(partial) });
}

export function createCustomObserver(
  id: string,
  label: string,
  position: readonly [number, number, number] | null,
  target: readonly [number, number, number],
  yaw: number,
  pitch: number,
  distance: number,
  dimension: SimulationDimension = 3,
  fov = 60,
  vpW = 640,
  vpH = 480
): ObserverFrame {
  const pos = position || calculateOrbitPosition(target, yaw, pitch, distance);
  const partial = {
    observerId: id,
    label,
    position: pos,
    target,
    up: [0, 1, 0] as const,
    yaw,
    pitch,
    distance,
    fov,
    dimension,
    viewportWidth: vpW,
    viewportHeight: vpH,
  };
  return Object.freeze({ ...partial, frameHash: computeFrameHash(partial) });
}

/* ─── LookAt Basis Matrix ─── */
function computeBasis(
  eye: readonly [number, number, number],
  target: readonly [number, number, number],
  up: readonly [number, number, number]
) {
  let fx = target[0] - eye[0];
  let fy = target[1] - eye[1];
  let fz = target[2] - eye[2];
  const fLen = Math.sqrt(fx * fx + fy * fy + fz * fz) || 1;
  fx /= fLen; fy /= fLen; fz /= fLen;

  let rx = fy * up[2] - fz * up[1];
  let ry = fz * up[0] - fx * up[2];
  let rz = fx * up[1] - fy * up[0];
  const rLen = Math.sqrt(rx * rx + ry * ry + rz * rz) || 1;
  rx /= rLen; ry /= rLen; rz /= rLen;

  const ux = ry * fz - rz * fy;
  const uy = rz * fx - rx * fz;
  const uz = rx * fy - ry * fx;

  return { right: [rx, ry, rz], up: [ux, uy, uz], forward: [fx, fy, fz] };
}

export function projectStateToObserver(
  state: UnderlyingState,
  observer: ObserverFrame
): ObservableFrame {
  const projectedObjects: ProjectedObject[] = [];

  if (observer.dimension === 3) {
    const basis = computeBasis(observer.position, observer.target, observer.up);
    const focalLength = (observer.viewportHeight / 2) / Math.tan((observer.fov * Math.PI) / 360);

    for (const record of state.records) {
      const dx = record.canonicalPosition[0] - observer.position[0];
      const dy = record.canonicalPosition[1] - observer.position[1];
      const dz = record.canonicalPosition[2] - observer.position[2];

      const vx = basis.right[0] * dx + basis.right[1] * dy + basis.right[2] * dz;
      const vy = basis.up[0] * dx + basis.up[1] * dy + basis.up[2] * dz;
      const vz = basis.forward[0] * dx + basis.forward[1] * dy + basis.forward[2] * dz;

      const depth = Number(vz.toFixed(4));
      let sx = -1, sy = -1, scale = 0, visible = false;

      if (depth > 0.1) {
        sx = Number(((observer.viewportWidth / 2) + (vx / depth) * focalLength).toFixed(2));
        sy = Number(((observer.viewportHeight / 2) - (vy / depth) * focalLength).toFixed(2));
        scale = Number((focalLength / depth).toFixed(4));
        visible = sx >= 0 && sx <= observer.viewportWidth && sy >= 0 && sy <= observer.viewportHeight;
      }

      projectedObjects.push({
        sourceStateId: record.id,
        entityName: record.entityName,
        authoritativeCoordinate: record.canonicalPosition,
        projectedCoordinate: [Number(vx.toFixed(4)), Number(vy.toFixed(4)), depth],
        screenCoordinate: [sx, sy],
        apparentScale: scale,
        visible,
        depth,
        observerFrameId: observer.observerId,
      });
    }
  } else if (observer.dimension === 2) {
    // Planar projection: observer projects based on its orientation (e.g. O0 -> [X,Y], O1 -> [Z,Y], O2 -> [X,Z])
    const margin = 50;
    const uw = observer.viewportWidth - margin * 2;
    const uh = observer.viewportHeight - margin * 2;

    for (const record of state.records) {
      const [wx, wy, wz] = record.canonicalPosition;
      let px = wx, py = wy;

      if (observer.observerId.includes('O1') || observer.observerId.includes('O4')) {
        // Side view exposes Z as horizontal, Y as vertical
        px = wz; py = wy;
      } else if (observer.observerId.includes('O2')) {
        // Top view exposes X as horizontal, Z as vertical
        px = wx; py = wz;
      }

      const sx = Number((margin + ((px + 10) / 30) * uw).toFixed(2));
      const sy = Number((margin + ((30 - py) / 30) * uh).toFixed(2));

      projectedObjects.push({
        sourceStateId: record.id,
        entityName: record.entityName,
        authoritativeCoordinate: record.canonicalPosition,
        projectedCoordinate: [px, py, null],
        screenCoordinate: [sx, sy],
        apparentScale: 1.0,
        visible: true,
        depth: 1,
        observerFrameId: observer.observerId,
      });
    }
  } else {
    // Z1 Linear projection: only 1 coordinate exposed per observer
    const margin = 50;
    const uw = observer.viewportWidth - margin * 2;

    for (const record of state.records) {
      const [wx, wy, wz] = record.canonicalPosition;
      let px = wx;
      if (observer.observerId.includes('O1') || observer.observerId.includes('O4')) px = wz;
      if (observer.observerId.includes('O2')) px = wy;

      const sx = Number((margin + ((px + 10) / 30) * uw).toFixed(2));
      const sy = observer.viewportHeight / 2;

      projectedObjects.push({
        sourceStateId: record.id,
        entityName: record.entityName,
        authoritativeCoordinate: record.canonicalPosition,
        projectedCoordinate: [px, null, null],
        screenCoordinate: [sx, sy],
        apparentScale: 1.0,
        visible: true,
        depth: 1,
        observerFrameId: observer.observerId,
      });
    }
  }

  const frozen = Object.freeze(projectedObjects);
  const visibleCount = frozen.filter((o) => o.visible).length;
  const frameChecksum = simpleHash(
    JSON.stringify([
      observer.yaw,
      observer.pitch,
      observer.distance,
      observer.target,
      frozen.map((o) => [
        o.sourceStateId,
        o.entityName,
        o.projectedCoordinate,
        o.screenCoordinate,
        o.visible,
        o.depth,
        o.apparentScale,
      ]),
    ])
  );
  const pixelSignature = simpleHash(
    JSON.stringify(frozen.map((o) => [o.screenCoordinate, o.visible, o.apparentScale]))
  );

  return Object.freeze({
    frameId: `P52_FRAME_${observer.observerId}_D${observer.dimension}`,
    observerId: observer.observerId,
    dimension: observer.dimension,
    objects: frozen,
    visibleCount,
    frameChecksum,
    pixelSignature,
  });
}
