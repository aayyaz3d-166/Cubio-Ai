/**
 * 3D Memory Studio — Funnel 56
 * 3D Transform Utilities & Affine Math
 */

import { Transform3D, WorldTransform3D } from '../types';

export function createDefaultTransform(
  position: [number, number, number] = [0, 0, 0],
  rotation: [number, number, number] = [0, 0, 0],
  scale: [number, number, number] = [1, 1, 1]
): Transform3D {
  return {
    position: [...position],
    rotation: [...rotation],
    scale: [...scale],
  };
}

export function createDefaultWorldTransform(): WorldTransform3D {
  const pos: readonly [number, number, number] = [0, 0, 0];
  const rot: readonly [number, number, number] = [0, 0, 0];
  const scl: readonly [number, number, number] = [1, 1, 1];
  return Object.freeze({
    position: pos,
    rotation: rot,
    scale: scl,
  });
}

/**
 * Computes World Transform from Local Transform and Parent World Transform.
 * Uses deterministic 3D affine matrix composition without external physics dependencies.
 */
export function computeWorldTransform(
  local: Transform3D,
  parent?: WorldTransform3D
): WorldTransform3D {
  if (!parent) {
    const pos: readonly [number, number, number] = [local.position[0], local.position[1], local.position[2]];
    const rot: readonly [number, number, number] = [local.rotation[0], local.rotation[1], local.rotation[2]];
    const scl: readonly [number, number, number] = [local.scale[0], local.scale[1], local.scale[2]];
    return Object.freeze({
      position: pos,
      rotation: rot,
      scale: scl,
    });
  }

  // 1. Scale propagation
  const worldScaleX = parent.scale[0] * local.scale[0];
  const worldScaleY = parent.scale[1] * local.scale[1];
  const worldScaleZ = parent.scale[2] * local.scale[2];

  // 2. Rotation propagation
  const worldRotX = parent.rotation[0] + local.rotation[0];
  const worldRotY = parent.rotation[1] + local.rotation[1];
  const worldRotZ = parent.rotation[2] + local.rotation[2];

  // 3. Position propagation (apply parent scale and rotation to local position)
  const [lx, ly, lz] = local.position;
  const scaledLx = lx * parent.scale[0];
  const scaledLy = ly * parent.scale[1];
  const scaledLz = lz * parent.scale[2];

  // Rotate around Y
  const cosY = Math.cos(parent.rotation[1]);
  const sinY = Math.sin(parent.rotation[1]);
  const x1 = scaledLx * cosY + scaledLz * sinY;
  const z1 = -scaledLx * sinY + scaledLz * cosY;

  // Rotate around X
  const cosX = Math.cos(parent.rotation[0]);
  const sinX = Math.sin(parent.rotation[0]);
  const y2 = scaledLy * cosX - z1 * sinX;
  const z2 = scaledLy * sinX + z1 * cosX;

  const worldPosX = parent.position[0] + x1;
  const worldPosY = parent.position[1] + y2;
  const worldPosZ = parent.position[2] + z2;

  const finalPos: readonly [number, number, number] = [
    Number(worldPosX.toFixed(4)),
    Number(worldPosY.toFixed(4)),
    Number(worldPosZ.toFixed(4)),
  ];
  const finalRot: readonly [number, number, number] = [
    Number(worldRotX.toFixed(4)),
    Number(worldRotY.toFixed(4)),
    Number(worldRotZ.toFixed(4)),
  ];
  const finalScl: readonly [number, number, number] = [
    Number(worldScaleX.toFixed(4)),
    Number(worldScaleY.toFixed(4)),
    Number(worldScaleZ.toFixed(4)),
  ];

  return Object.freeze({
    position: finalPos,
    rotation: finalRot,
    scale: finalScl,
  });
}
