/**
 * 3D Memory Studio — Funnel 87
 * Observer: Orbit Parallax Motion Evaluator
 */

import { F87SpatialState, F87ObserverState, F87ProjectionType, F87DisplayState } from '../types';
import { synthesizeParallaxDisplay } from '../projection/parallaxProjection';

export function executeOrbitSequence(
  state: F87SpatialState,
  radius = 40,
  elevation = 0,
  projection: F87ProjectionType = 'PERSPECTIVE_3D',
  angles: readonly number[] = [0, 45, 90, 135, 180, 270, 360]
): {
  steps: readonly {
    orbitAngleDeg: number;
    observer: F87ObserverState;
    display: F87DisplayState;
  }[];
  is360Restoration: boolean;
} {
  const steps: {
    orbitAngleDeg: number;
    observer: F87ObserverState;
    display: F87DisplayState;
  }[] = [];

  let baselineDisplay: F87DisplayState | null = null;

  for (const angle of angles) {
    const rad = (angle * Math.PI) / 180;
    const x = Number((radius * Math.sin(rad)).toFixed(4));
    const z = Number((radius * Math.cos(rad)).toFixed(4));
    const yaw = Number((-angle).toFixed(4));

    const obs: F87ObserverState = Object.freeze({
      observerId: `OBS_ORBIT_${angle}`,
      name: `Orbit Observer ${angle}°`,
      position: [x, elevation, z] as const,
      orientation: [yaw, 0] as const,
      zoom: 1.0,
      fovDegrees: 60,
      focalLength: 300,
    });

    const display = synthesizeParallaxDisplay(state, obs, projection, baselineDisplay);
    if (!baselineDisplay) baselineDisplay = display;

    steps.push({
      orbitAngleDeg: angle,
      observer: obs,
      display,
    });
  }

  const firstHash = steps[0].display.displayChecksum;
  const lastHash = steps[steps.length - 1].display.displayChecksum;
  const is360Restoration = firstHash === lastHash;

  return {
    steps: Object.freeze(steps),
    is360Restoration,
  };
}
