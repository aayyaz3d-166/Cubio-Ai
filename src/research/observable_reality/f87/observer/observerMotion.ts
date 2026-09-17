/**
 * 3D Memory Studio — Funnel 87
 * Observer: Motion Sequence & Reversibility Evaluator
 */

import { F87SpatialState, F87ObserverState, F87ProjectionType, F87DisplayState } from '../types';
import { translateF87Observer, rotateF87Observer } from './observerState';
import { synthesizeParallaxDisplay } from '../projection/parallaxProjection';

export function executeMotionSequence(
  state: F87SpatialState,
  initialObserver: F87ObserverState,
  projection: F87ProjectionType
): {
  displays: readonly F87DisplayState[];
  isExactRestoration: boolean;
} {
  const displays: F87DisplayState[] = [];

  // O0
  const d0 = synthesizeParallaxDisplay(state, initialObserver, projection);
  displays.push(d0);

  // O1: Translate X+15, Z-5
  let obs = translateF87Observer(initialObserver, 15, 0, -5);
  const d1 = synthesizeParallaxDisplay(state, obs, projection, d0);
  displays.push(d1);

  // O2: Translate Y+10, Rotate Yaw+20
  obs = translateF87Observer(obs, 0, 10, 0);
  obs = rotateF87Observer(obs, 20, 0);
  const d2 = synthesizeParallaxDisplay(state, obs, projection, d0);
  displays.push(d2);

  // O3: Translate X-25, Rotate Yaw-30
  obs = translateF87Observer(obs, -25, -5, 5);
  obs = rotateF87Observer(obs, -30, 0);
  const d3 = synthesizeParallaxDisplay(state, obs, projection, d0);
  displays.push(d3);

  // O0': Return to exact initial state
  const d0Prime = synthesizeParallaxDisplay(state, initialObserver, projection, d0);
  displays.push(d0Prime);

  const isExactRestoration = d0.displayChecksum === d0Prime.displayChecksum;

  return {
    displays: Object.freeze(displays),
    isExactRestoration,
  };
}
