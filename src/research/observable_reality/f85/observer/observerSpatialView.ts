/**
 * 3D Memory Studio — Funnel 85
 * Observer: Spatial View Manager & Factory
 */

import { F85ObserverState } from '../types';

export function createStandardObservers(): {
  observerA: F85ObserverState;
  observerB: F85ObserverState;
  observerC: F85ObserverState;
} {
  const observerA: F85ObserverState = Object.freeze({
    observerId: 'OBSERVER_A',
    name: 'Frontal Perspective Observer',
    position: [0, 0, 40] as const,
    orientation: [0, 0] as const,
    zoom: 1.0,
    fovDegrees: 60,
    focalLength: 300,
  });

  const observerB: F85ObserverState = Object.freeze({
    observerId: 'OBSERVER_B',
    name: 'Oblique Elevated Observer',
    position: [25, 20, 35] as const,
    orientation: [10, 25] as const,
    zoom: 1.0,
    fovDegrees: 60,
    focalLength: 300,
  });

  const observerC: F85ObserverState = Object.freeze({
    observerId: 'OBSERVER_C',
    name: 'Top-Down Orthographic Observer',
    position: [0, 60, 0] as const,
    orientation: [-90, 0] as const,
    zoom: 1.0,
    fovDegrees: 60,
    focalLength: 300,
  });

  return { observerA, observerB, observerC };
}

export function translateObserver(
  obs: F85ObserverState,
  dx: number,
  dy: number,
  dz: number
): F85ObserverState {
  const [x, y, z] = obs.position;
  return Object.freeze({
    ...obs,
    position: [x + dx, y + dy, z + dz] as [number, number, number],
  });
}

export function rotateObserver(
  obs: F85ObserverState,
  dYaw: number,
  dPitch: number
): F85ObserverState {
  const [yaw, pitch] = obs.orientation;
  return Object.freeze({
    ...obs,
    orientation: [yaw + dYaw, pitch + dPitch] as [number, number],
  });
}

export function zoomObserver(obs: F85ObserverState, factor: number): F85ObserverState {
  const newZoom = Math.max(0.2, Math.min(5.0, obs.zoom * factor));
  return Object.freeze({
    ...obs,
    zoom: Number(newZoom.toFixed(2)),
  });
}
