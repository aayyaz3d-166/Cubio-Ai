/**
 * 3D Memory Studio — Funnel 86
 * Observer: Visibility Traversal Path & Reversibility Evaluator
 */

import { F86SpatialScene, F86ObserverState, F86ProjectionType, F86DisplayState } from '../types';
import { translateF86Observer, rotateF86Observer } from './observerVisibility';
import { synthesizeVisibilityDisplay } from '../projection/visibilityProjection';

export function testObserverVisibilityTraversal(
  scene: F86SpatialScene,
  initialObserver: F86ObserverState,
  projection: F86ProjectionType
): {
  displays: readonly F86DisplayState[];
  isFullyReversible: boolean;
} {
  const displays: F86DisplayState[] = [];

  // O0
  const d0 = synthesizeVisibilityDisplay(scene, initialObserver, projection);
  displays.push(d0);

  // O1: Move right & forward
  let obs = translateF86Observer(initialObserver, 15, 0, -10);
  const d1 = synthesizeVisibilityDisplay(scene, obs, projection);
  displays.push(d1);

  // O2: Elevate & rotate
  obs = translateF86Observer(obs, 0, 20, 0);
  obs = rotateF86Observer(obs, 20, 15);
  const d2 = synthesizeVisibilityDisplay(scene, obs, projection);
  displays.push(d2);

  // O3: Translate back
  obs = translateF86Observer(initialObserver, -10, 5, 5);
  const d3 = synthesizeVisibilityDisplay(scene, obs, projection);
  displays.push(d3);

  // O0': Reset to initial
  const d0Prime = synthesizeVisibilityDisplay(scene, initialObserver, projection);
  displays.push(d0Prime);

  const isFullyReversible = d0.displayChecksum === d0Prime.displayChecksum;

  return {
    displays: Object.freeze(displays),
    isFullyReversible,
  };
}
