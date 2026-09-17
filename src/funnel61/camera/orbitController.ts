/**
 * 3D Memory Studio — Funnel 60 / Funnel 61
 * Deterministic Orbit Controller
 */

import { CameraState } from '../types';
import { clampPitch, clampDistance, clampCameraPosition } from './cameraSafetyController';

export function recalculateOrbitPosition(state: CameraState): void {
  const pitchClamped = clampPitch(state.pitch);
  const distClamped = clampDistance(state.distance);
  state.pitch = pitchClamped;
  state.distance = distClamped;

  const pitchRad = (state.pitch * Math.PI) / 180;
  const yawRad = (state.yaw * Math.PI) / 180;

  const [tx, ty, tz] = state.target;

  const px = tx + state.distance * Math.cos(pitchRad) * Math.sin(yawRad);
  const py = ty + state.distance * Math.sin(pitchRad);
  const pz = tz + state.distance * Math.cos(pitchRad) * Math.cos(yawRad);

  state.position = clampCameraPosition([
    Number(px.toFixed(3)),
    Number(py.toFixed(3)),
    Number(pz.toFixed(3)),
  ]);
}

export function rotateHorizontal(state: CameraState, deltaYaw: number): void {
  state.yaw = (state.yaw + deltaYaw) % 360;
  recalculateOrbitPosition(state);
}

export function rotateVertical(state: CameraState, deltaPitch: number): void {
  state.pitch = clampPitch(state.pitch + deltaPitch);
  recalculateOrbitPosition(state);
}

export function setOrbitYawPitch(state: CameraState, yaw: number, pitch: number): void {
  state.yaw = yaw % 360;
  state.pitch = clampPitch(pitch);
  recalculateOrbitPosition(state);
}
