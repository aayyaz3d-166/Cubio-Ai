/**
 * 3D Memory Studio — Phase 5: Observation & Reconstruction
 * P5.1: Projection Pipeline
 *
 * Underlying State → Scene Representation → Observer Frame → Projection → Screen Coordinates → Observable Frame
 *
 * The projection layer NEVER modifies the underlying state.
 */

import {
  P51UnderlyingState,
  P51ObserverFrame,
  P51ProjectedObject,
  P51ObservableFrame,
  P51Dimension,
} from './types';

function simpleHash(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/**
 * Compute a view matrix (simplified lookAt) for transforming world coordinates into view space.
 */
function computeViewMatrix(
  eye: readonly [number, number, number],
  target: readonly [number, number, number],
  up: readonly [number, number, number]
): { right: [number, number, number]; up: [number, number, number]; forward: [number, number, number] } {
  // Forward = normalize(target - eye)
  let fx = target[0] - eye[0];
  let fy = target[1] - eye[1];
  let fz = target[2] - eye[2];
  const fLen = Math.sqrt(fx * fx + fy * fy + fz * fz) || 1;
  fx /= fLen; fy /= fLen; fz /= fLen;

  // Right = normalize(forward × up)
  let rx = fy * up[2] - fz * up[1];
  let ry = fz * up[0] - fx * up[2];
  let rz = fx * up[1] - fy * up[0];
  const rLen = Math.sqrt(rx * rx + ry * ry + rz * rz) || 1;
  rx /= rLen; ry /= rLen; rz /= rLen;

  // True up = right × forward
  const ux = ry * fz - rz * fy;
  const uy = rz * fx - rx * fz;
  const uz = rx * fy - ry * fx;

  return {
    right: [rx, ry, rz],
    up: [ux, uy, uz],
    forward: [fx, fy, fz],
  };
}

function transformToViewSpace(
  worldPos: readonly [number, number, number],
  eye: readonly [number, number, number],
  basis: { right: [number, number, number]; up: [number, number, number]; forward: [number, number, number] }
): [number, number, number] {
  const dx = worldPos[0] - eye[0];
  const dy = worldPos[1] - eye[1];
  const dz = worldPos[2] - eye[2];

  const vx = basis.right[0] * dx + basis.right[1] * dy + basis.right[2] * dz;
  const vy = basis.up[0] * dx + basis.up[1] * dy + basis.up[2] * dz;
  const vz = basis.forward[0] * dx + basis.forward[1] * dy + basis.forward[2] * dz;

  return [
    Number(vx.toFixed(4)),
    Number(vy.toFixed(4)),
    Number(vz.toFixed(4)),
  ];
}

function projectToScreen(
  viewPos: [number, number, number],
  fov: number,
  zoom: number,
  vpW: number,
  vpH: number
): { screen: [number, number]; depth: number; scale: number; visible: boolean } {
  const depth = viewPos[2];
  if (depth <= 0.01) {
    return { screen: [-1, -1], depth, scale: 0, visible: false };
  }

  const focalLength = (vpH / 2) / Math.tan((fov * Math.PI) / 360);
  const sx = (vpW / 2) + (viewPos[0] / depth) * focalLength * zoom;
  const sy = (vpH / 2) - (viewPos[1] / depth) * focalLength * zoom;
  const scale = (focalLength * zoom) / depth;

  const visible = sx >= 0 && sx <= vpW && sy >= 0 && sy <= vpH && depth > 0;

  return {
    screen: [Number(sx.toFixed(2)), Number(sy.toFixed(2))],
    depth: Number(depth.toFixed(4)),
    scale: Number(scale.toFixed(4)),
    visible,
  };
}

function projectDimensional(
  worldPos: readonly [number, number, number],
  dimension: P51Dimension,
  vpW: number,
  vpH: number
): { projected: [number, number, number | null]; screen: [number, number]; scale: number; visible: boolean } {
  const margin = 60;
  const usableW = vpW - margin * 2;
  const usableH = vpH - margin * 2;

  if (dimension === 2) {
    const sx = margin + ((worldPos[0] + 10) / 20) * usableW;
    const sy = margin + ((10 - worldPos[1]) / 20) * usableH;
    return {
      projected: [worldPos[0], worldPos[1], null],
      screen: [Number(sx.toFixed(2)), Number(sy.toFixed(2))],
      scale: 1.0,
      visible: true,
    };
  }

  // Z1 — only X axis
  const sx = margin + ((worldPos[0] + 10) / 20) * usableW;
  const sy = vpH / 2;
  return {
    projected: [worldPos[0], null, null],
    screen: [Number(sx.toFixed(2)), Number(sy.toFixed(2))],
    scale: 1.0,
    visible: true,
  };
}

/**
 * Main projection pipeline:
 * UnderlyingState × ObserverFrame → ObservableFrame
 *
 * The underlying state is consumed READ-ONLY. It is never mutated.
 */
export function projectState(
  state: P51UnderlyingState,
  observer: P51ObserverFrame
): P51ObservableFrame {
  const projectedObjects: P51ProjectedObject[] = [];

  if (observer.dimension === 3) {
    const basis = computeViewMatrix(observer.position, observer.target, observer.up);

    for (const record of state.records) {
      const viewPos = transformToViewSpace(record.canonicalPosition, observer.position, basis);
      const { screen, depth, scale, visible } = projectToScreen(
        viewPos,
        observer.fov,
        observer.zoom,
        observer.viewportWidth,
        observer.viewportHeight
      );

      projectedObjects.push({
        sourceStateId: record.id,
        entityName: record.entityName,
        authoritativeCoordinate: record.canonicalPosition,
        projectedCoordinate: viewPos,
        screenCoordinate: screen,
        apparentScale: scale,
        visible,
        depth,
        observerFrameId: observer.observerId,
      });
    }
  } else {
    for (const record of state.records) {
      const { projected, screen, scale, visible } = projectDimensional(
        record.canonicalPosition,
        observer.dimension,
        observer.viewportWidth,
        observer.viewportHeight
      );

      projectedObjects.push({
        sourceStateId: record.id,
        entityName: record.entityName,
        authoritativeCoordinate: record.canonicalPosition,
        projectedCoordinate: projected,
        screenCoordinate: screen,
        apparentScale: scale,
        visible,
        depth: 1,
        observerFrameId: observer.observerId,
      });
    }
  }

  const frozen = Object.freeze(projectedObjects);
  const visibleCount = frozen.filter((o) => o.visible).length;
  const frameChecksum = simpleHash(JSON.stringify(frozen));
  const pixelSignature = simpleHash(
    JSON.stringify(frozen.map((o) => [o.screenCoordinate, o.visible, o.apparentScale]))
  );

  return Object.freeze({
    frameId: `FRAME_${observer.observerId}_D${observer.dimension}`,
    observerId: observer.observerId,
    dimension: observer.dimension,
    projectionType: observer.projectionType,
    objects: frozen,
    visibleCount,
    frameChecksum,
    pixelSignature,
  });
}
