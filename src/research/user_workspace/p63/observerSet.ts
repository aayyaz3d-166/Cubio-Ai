/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.3: Multi-Observer Set Manager
 *
 * Manages three orthogonal, independent observers (O0, O1, O2).
 * Changing one observer leaves the others completely unmutated.
 */

import { WorkspaceObserver, WorkspaceDimension, WorkspaceProjectionType } from '../p61/types';
import { P63ObserverSet, ObserverKey } from './types';
import { computeObserverChecksum } from '../p61/observerController';
import { calculateOrbitPosition } from '../../observation_reconstruction/p52/multiObserver';

export function createObserverO0(
  dim: WorkspaceDimension = 2,
  vpW = 540,
  vpH = 360
): WorkspaceObserver {
  const partial = {
    observerId: 'P63_OBSERVER_O0',
    label: 'O0 — Front Observer [X, Y]',
    position: [0, 20, 260] as const,
    target: [5, 3, 6] as const,
    up: [0, 1, 0] as const,
    yaw: 0,
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

export function createObserverO1(
  dim: WorkspaceDimension = 2,
  vpW = 540,
  vpH = 360
): WorkspaceObserver {
  const partial = {
    observerId: 'P63_OBSERVER_O1',
    label: 'O1 — Side Observer [Z, Y]',
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

export function createObserverO2(
  dim: WorkspaceDimension = 2,
  vpW = 540,
  vpH = 360
): WorkspaceObserver {
  const partial = {
    observerId: 'P63_OBSERVER_O2',
    label: 'O2 — Top Observer [X, Z]',
    position: [0, 260, 6] as const,
    target: [5, 3, 6] as const,
    up: [0, 0, -1] as const,
    yaw: 0,
    pitch: 85,
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

export function createDefaultObserverSet(dim: WorkspaceDimension = 2): P63ObserverSet {
  return Object.freeze({
    O0: createObserverO0(dim),
    O1: createObserverO1(dim),
    O2: createObserverO2(dim),
  });
}

export function mutateSingleObserver(
  set: P63ObserverSet,
  key: ObserverKey,
  mutation: (obs: WorkspaceObserver) => WorkspaceObserver
): P63ObserverSet {
  const current = set[key];
  const updated = mutation(current);

  return Object.freeze({
    ...set,
    [key]: updated,
  });
}
