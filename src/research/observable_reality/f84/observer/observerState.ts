/**
 * 3D Memory Studio — Funnel 84
 * Observer: Observer State Factory & Initializers
 */

import { ObserverState } from '../types';

export function createObserverState(
  observerId: string,
  name: string,
  options: {
    position?: readonly number[];
    orientation?: readonly number[];
    zoom?: number;
    fovDegrees?: number;
    focalLength?: number;
    dimension?: number;
    metadata?: Record<string, unknown>;
  } = {}
): ObserverState {
  return Object.freeze({
    observerId,
    name,
    position: Object.freeze([...(options.position ?? [0, 0, 50, 0])]),
    orientation: Object.freeze([...(options.orientation ?? [0, 0, 0])]),
    zoom: options.zoom ?? 1.0,
    fovDegrees: options.fovDegrees ?? 60,
    focalLength: options.focalLength ?? 300,
    dimension: options.dimension ?? 3,
    metadata: Object.freeze({ ...options.metadata }),
  });
}

export function createStandardResearchObservers(): {
  observerA: ObserverState;
  observerB: ObserverState;
  observerC: ObserverState;
} {
  const observerA = createObserverState('OBSERVER_A', 'Primary Frontal Observer', {
    position: [0, 0, 40, 0],
    orientation: [0, 0, 0],
    zoom: 1.0,
    dimension: 3,
    metadata: { role: 'PRIMARY' },
  });

  const observerB = createObserverState('OBSERVER_B', 'Oblique Elevated Observer', {
    position: [25, 20, 35, 10],
    orientation: [30, 25, 0],
    zoom: 1.25,
    dimension: 3,
    metadata: { role: 'OBLIQUE' },
  });

  const observerC = createObserverState('OBSERVER_C', 'Orthogonal Top Observer', {
    position: [0, 60, 0, -5],
    orientation: [0, 90, 0],
    zoom: 0.8,
    dimension: 3,
    metadata: { role: 'TOP_DOWN' },
  });

  return { observerA, observerB, observerC };
}
