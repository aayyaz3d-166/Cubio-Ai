/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.1: Observer Controller
 *
 * Manages observer configuration independently from underlying reality X.
 * Supports Z3, Z2, and Z1 observations.
 */

import { WorkspaceObserver, WorkspaceDimension, WorkspaceProjectionType } from './types';
import { calculateOrbitPosition } from '../../observation_reconstruction/p52/multiObserver';
import { simpleHash } from './realityBuilder';

export function computeObserverChecksum(observer: Omit<WorkspaceObserver, 'observerChecksum'>): string {
  const normalized = {
    id: observer.observerId,
    pos: observer.position,
    target: observer.target,
    up: observer.up,
    yaw: observer.yaw,
    pitch: observer.pitch,
    distance: observer.distance,
    fov: observer.fov,
    dim: observer.dimension,
    proj: observer.projectionType,
  };
  return simpleHash(JSON.stringify(normalized));
}

export function createDefaultWorkspaceObserver(
  dimension: WorkspaceDimension = 3,
  viewportWidth = 640,
  viewportHeight = 480
): WorkspaceObserver {
  const target: [number, number, number] = [10, 8, 10]; // Center around experimental cluster
  const distance = 240;
  const yaw = 25;
  const pitch = 20;
  const position = calculateOrbitPosition(target, yaw, pitch, distance);

  const partial = {
    observerId: 'P61_WORKSPACE_OBSERVER_DEFAULT',
    label: 'Workspace Primary Observer',
    position,
    target,
    up: [0, 1, 0] as const,
    yaw,
    pitch,
    distance,
    fov: 60,
    dimension,
    projectionType: (dimension === 3 ? 'PERSPECTIVE_3D' : dimension === 2 ? 'DIMENSIONAL_Z2' : 'DIMENSIONAL_Z1') as WorkspaceProjectionType,
    viewportWidth,
    viewportHeight,
  };

  return Object.freeze({
    ...partial,
    observerChecksum: computeObserverChecksum(partial),
  });
}

export function updateObserverOrientation(
  observer: WorkspaceObserver,
  deltaYaw: number,
  deltaPitch: number
): WorkspaceObserver {
  const nextYaw = (observer.yaw + deltaYaw) % 360;
  const nextPitch = Math.max(-85, Math.min(85, observer.pitch + deltaPitch));
  const nextPos = calculateOrbitPosition(observer.target, nextYaw, nextPitch, observer.distance);

  const partial = {
    ...observer,
    position: nextPos,
    yaw: nextYaw,
    pitch: nextPitch,
  };

  return Object.freeze({
    ...partial,
    observerChecksum: computeObserverChecksum(partial),
  });
}

export function updateObserverDistance(
  observer: WorkspaceObserver,
  deltaDistance: number
): WorkspaceObserver {
  const nextDist = Math.max(30, Math.min(600, observer.distance + deltaDistance));
  const nextPos = calculateOrbitPosition(observer.target, observer.yaw, observer.pitch, nextDist);

  const partial = {
    ...observer,
    position: nextPos,
    distance: nextDist,
  };

  return Object.freeze({
    ...partial,
    observerChecksum: computeObserverChecksum(partial),
  });
}

export function updateObserverPan(
  observer: WorkspaceObserver,
  deltaX: number,
  deltaY: number
): WorkspaceObserver {
  const nextTarget: [number, number, number] = [
    observer.target[0] + deltaX,
    observer.target[1] + deltaY,
    observer.target[2],
  ];
  const nextPos = calculateOrbitPosition(nextTarget, observer.yaw, observer.pitch, observer.distance);

  const partial = {
    ...observer,
    target: nextTarget,
    position: nextPos,
  };

  return Object.freeze({
    ...partial,
    observerChecksum: computeObserverChecksum(partial),
  });
}

export function setObserverDimension(
  observer: WorkspaceObserver,
  dimension: WorkspaceDimension
): WorkspaceObserver {
  const proj: WorkspaceProjectionType =
    dimension === 3 ? 'PERSPECTIVE_3D' : dimension === 2 ? 'DIMENSIONAL_Z2' : 'DIMENSIONAL_Z1';

  const partial = {
    ...observer,
    dimension,
    projectionType: proj,
  };

  return Object.freeze({
    ...partial,
    observerChecksum: computeObserverChecksum(partial),
  });
}

export function resetObserverState(
  dimension: WorkspaceDimension = 3,
  viewportWidth = 640,
  viewportHeight = 480
): WorkspaceObserver {
  return createDefaultWorkspaceObserver(dimension, viewportWidth, viewportHeight);
}
