/**
 * 3D Memory Studio — Funnel 86
 * Observer: Systematic Observer Rotation Traversal
 */

import { F86SpatialScene, F86ObserverState, F86ProjectionType, F86DisplayState } from '../types';
import { rotateF86Observer } from './observerVisibility';
import { synthesizeVisibilityDisplay } from '../projection/visibilityProjection';

export function executeObserverRotationSequence(
  scene: F86SpatialScene,
  initialObserver: F86ObserverState,
  projection: F86ProjectionType,
  angles: readonly number[] = [0, 45, 90, 135, 180, 270, 360]
): {
  steps: readonly {
    yaw: number;
    observer: F86ObserverState;
    display: F86DisplayState;
    visibleCount: number;
    hiddenCount: number;
  }[];
  is360ExactRestoration: boolean;
} {
  const steps: {
    yaw: number;
    observer: F86ObserverState;
    display: F86DisplayState;
    visibleCount: number;
    hiddenCount: number;
  }[] = [];

  for (const angle of angles) {
    const obs = rotateF86Observer(
      { ...initialObserver, orientation: [initialObserver.orientation[0], initialObserver.orientation[1]] },
      angle,
      0
    );
    const display = synthesizeVisibilityDisplay(scene, obs, projection);
    const visibleCount = display.objectRecords.filter((r) => r.visible).length;
    const hiddenCount = display.objectRecords.length - visibleCount;

    steps.push({
      yaw: angle,
      observer: obs,
      display,
      visibleCount,
      hiddenCount,
    });
  }

  const initialChecksum = steps[0].display.displayChecksum;
  const finalChecksum = steps[steps.length - 1].display.displayChecksum;
  const is360ExactRestoration = initialChecksum === finalChecksum;

  return {
    steps: Object.freeze(steps),
    is360ExactRestoration,
  };
}
