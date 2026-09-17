/**
 * 3D Memory Studio — Funnel 86
 * Observer: Standard Visibility Observers & Modifiers
 */

import { F86ObserverState } from '../types';

export function createStandardF86Observers(): {
  observerA: F86ObserverState;
  observerB: F86ObserverState;
  observerC: F86ObserverState;
} {
  const observerA: F86ObserverState = Object.freeze({
    observerId: 'OBSERVER_A',
    name: 'Frontal Perspective Observer',
    position: [0, 0, 40] as const,
    orientation: [0, 0] as const,
    zoom: 1.0,
    horizontalFov: 60,
    verticalFov: 45,
    nearPlane: 1.0,
    farPlane: 200.0,
    focalLength: 300,
  });

  const observerB: F86ObserverState = Object.freeze({
    observerId: 'OBSERVER_B',
    name: 'Oblique Elevated Observer',
    position: [25, 20, 35] as const,
    orientation: [10, 25] as const,
    zoom: 1.0,
    horizontalFov: 60,
    verticalFov: 45,
    nearPlane: 1.0,
    farPlane: 200.0,
    focalLength: 300,
  });

  const observerC: F86ObserverState = Object.freeze({
    observerId: 'OBSERVER_C',
    name: 'Top-Down Orthographic Observer',
    position: [0, 60, 0] as const,
    orientation: [-90, 0] as const,
    zoom: 1.0,
    horizontalFov: 60,
    verticalFov: 45,
    nearPlane: 1.0,
    farPlane: 200.0,
    focalLength: 300,
  });

  return { observerA, observerB, observerC };
}

export function translateF86Observer(
  obs: F86ObserverState,
  dx: number,
  dy: number,
  dz: number
): F86ObserverState {
  const [x, y, z] = obs.position;
  return Object.freeze({
    ...obs,
    position: [x + dx, y + dy, z + dz] as [number, number, number],
  });
}

export function rotateF86Observer(
  obs: F86ObserverState,
  dYaw: number,
  dPitch: number
): F86ObserverState {
  const [yaw, pitch] = obs.orientation;
  return Object.freeze({
    ...obs,
    orientation: [yaw + dYaw, pitch + dPitch] as [number, number],
  });
}

export function adjustFov(obs: F86ObserverState, deltaDeg: number): F86ObserverState {
  const newHFov = Math.max(15, Math.min(120, obs.horizontalFov + deltaDeg));
  const newVFov = Math.max(10, Math.min(90, obs.verticalFov + deltaDeg * 0.75));
  return Object.freeze({
    ...obs,
    horizontalFov: Number(newHFov.toFixed(1)),
    verticalFov: Number(newVFov.toFixed(1)),
  });
}
