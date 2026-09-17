/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.4: Observer Fusion Engine
 *
 * Combines arbitrary observer subsets, preserves observer identities and orientations,
 * and generates corresponding observable frames.
 */

import { WorkspaceReality, WorkspaceObserver, WorkspaceDimension, WorkspaceProjectionType } from '../p61/types';
import { ExtendedObserverKey, ObserverFusionConfig } from './types';
import { computeObserverChecksum } from '../p61/observerController';
import { createObserverO0, createObserverO1, createObserverO2 } from '../p63/observerSet';
import { bridgeWorkspaceToP5Reality, bridgeWorkspaceToP5Observer } from '../p61/observationBridge';
import { projectStateToObserver } from '../../observation_reconstruction/p52/multiObserver';
import { ObservableFrame } from '../../observation_reconstruction/p52/types';

export function createObserverO3Redundant(
  dim: WorkspaceDimension = 2,
  vpW = 540,
  vpH = 360
): WorkspaceObserver {
  // Redundant observer: identical projection to O0 [X,Y] from slightly shifted front position
  const partial = {
    observerId: 'P64_OBSERVER_O3_REDUNDANT',
    label: 'O3 — Redundant Front Observer [X, Y]',
    position: [0, 25, 270] as const,
    target: [5, 3, 6] as const,
    up: [0, 1, 0] as const,
    yaw: 0,
    pitch: 5,
    distance: 270,
    fov: 60,
    dimension: dim,
    projectionType: (dim === 3 ? 'PERSPECTIVE_3D' : dim === 2 ? 'DIMENSIONAL_Z2' : 'DIMENSIONAL_Z1') as WorkspaceProjectionType,
    viewportWidth: vpW,
    viewportHeight: vpH,
  };

  return Object.freeze({
    ...partial,
    observerChecksum: computeObserverChecksum(partial),
  });
}

export function createObserverO4Noisy(
  dim: WorkspaceDimension = 2,
  vpW = 540,
  vpH = 360
): WorkspaceObserver {
  // Noisy observer: applies controlled coordinate offset
  const partial = {
    observerId: 'P64_OBSERVER_O4_NOISY',
    label: 'O4 — Perturbed Side Observer [Z+ε, Y]',
    position: [260, 20, 6] as const,
    target: [5, 3, 6] as const,
    up: [0, 1, 0] as const,
    yaw: 90,
    pitch: 5,
    distance: 260,
    fov: 60,
    dimension: dim,
    projectionType: (dim === 3 ? 'PERSPECTIVE_3D' : dim === 2 ? 'DIMENSIONAL_Z2' : 'DIMENSIONAL_Z1') as WorkspaceProjectionType,
    viewportWidth: vpW,
    viewportHeight: vpH,
  };

  return Object.freeze({
    ...partial,
    observerChecksum: computeObserverChecksum(partial),
  });
}

export function createStandardObserverMap(dim: WorkspaceDimension = 2): Record<ExtendedObserverKey, WorkspaceObserver> {
  return {
    O0: createObserverO0(dim),
    O1: createObserverO1(dim),
    O2: createObserverO2(dim),
    O3_REDUNDANT: createObserverO3Redundant(dim),
    O4_NOISY: createObserverO4Noisy(dim),
  };
}

export class ObserverFusionEngine {
  public static projectAllActiveFrames(
    reality: WorkspaceReality,
    observers: Record<string, WorkspaceObserver>,
    config: ObserverFusionConfig
  ): Record<string, ObservableFrame> {
    const p5State = bridgeWorkspaceToP5Reality(reality);
    const frameMap: Record<string, ObservableFrame> = {};

    for (const key of config.enabledKeys) {
      const obs = observers[key];
      if (!obs) continue;

      const p5Obs = bridgeWorkspaceToP5Observer(obs);
      let frame = projectStateToObserver(p5State, p5Obs);

      // Inject controlled noise if configured for noisy observer
      if (key === 'O4_NOISY' && config.noiseMagnitude > 0) {
        const noisyObjs = frame.objects.map((obj) => ({
          ...obj,
          projectedCoordinate: [
            obj.projectedCoordinate[0] !== null ? obj.projectedCoordinate[0] + config.noiseMagnitude : null,
            obj.projectedCoordinate[1],
            obj.projectedCoordinate[2],
          ] as [number | null, number | null, number | null],
        }));
        frame = Object.freeze({
          ...frame,
          objects: Object.freeze(noisyObjs),
        });
      }

      frameMap[key] = frame;
    }

    return Object.freeze(frameMap);
  }
}
