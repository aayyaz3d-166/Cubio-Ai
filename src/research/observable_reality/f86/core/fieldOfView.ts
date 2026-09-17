/**
 * 3D Memory Studio — Funnel 86
 * Core: Field of View (FOV) & Frustum Evaluator
 */

import { F86ObserverState, F86VisibilityReason } from '../types';

export interface F86FovEvaluation {
  readonly inFrustum: boolean;
  readonly behindObserver: boolean;
  readonly depthDistance: number;
  readonly horizontalAngleDeg: number;
  readonly verticalAngleDeg: number;
  readonly reason: F86VisibilityReason;
}

export function evaluateFieldOfView(
  viewPos: readonly [number, number, number],
  observer: F86ObserverState
): F86FovEvaluation {
  const [vx, vy, vz] = viewPos;

  // In standard camera space: camera looks toward -Z, so forward depth is -vz
  const forwardDepth = -vz;

  if (forwardDepth <= 0) {
    return {
      inFrustum: false,
      behindObserver: true,
      depthDistance: forwardDepth,
      horizontalAngleDeg: 180,
      verticalAngleDeg: 180,
      reason: 'BEHIND_OBSERVER',
    };
  }

  if (forwardDepth < observer.nearPlane) {
    return {
      inFrustum: false,
      behindObserver: false,
      depthDistance: forwardDepth,
      horizontalAngleDeg: 0,
      verticalAngleDeg: 0,
      reason: 'BEFORE_NEAR_PLANE',
    };
  }

  if (forwardDepth > observer.farPlane) {
    return {
      inFrustum: false,
      behindObserver: false,
      depthDistance: forwardDepth,
      horizontalAngleDeg: 0,
      verticalAngleDeg: 0,
      reason: 'BEYOND_FAR_PLANE',
    };
  }

  const hAngleRad = Math.atan2(Math.abs(vx), forwardDepth);
  const vAngleRad = Math.atan2(Math.abs(vy), forwardDepth);

  const hAngleDeg = (hAngleRad * 180) / Math.PI;
  const vAngleDeg = (vAngleRad * 180) / Math.PI;

  const halfHFov = observer.horizontalFov / 2;
  const halfVFov = observer.verticalFov / 2;

  if (hAngleDeg > halfHFov || vAngleDeg > halfVFov) {
    return {
      inFrustum: false,
      behindObserver: false,
      depthDistance: forwardDepth,
      horizontalAngleDeg: Number(hAngleDeg.toFixed(2)),
      verticalAngleDeg: Number(vAngleDeg.toFixed(2)),
      reason: 'OUTSIDE_FOV',
    };
  }

  return {
    inFrustum: true,
    behindObserver: false,
    depthDistance: forwardDepth,
    horizontalAngleDeg: Number(hAngleDeg.toFixed(2)),
    verticalAngleDeg: Number(vAngleDeg.toFixed(2)),
    reason: 'VISIBLE',
  };
}
