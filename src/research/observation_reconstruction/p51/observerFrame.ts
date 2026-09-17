/**
 * 3D Memory Studio — Phase 5: Observation & Reconstruction
 * P5.1: Observer Frame Factory
 *
 * Creates observer frames O0, O1, O2 with different positions/orientations.
 * Observer frames contain observation conditions only — no semantic interpretation.
 */

import { P51ObserverFrame, P51Dimension, P51ProjectionType } from './types';

function simpleHash(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function computeFrameHash(frame: Omit<P51ObserverFrame, 'frameHash'>): string {
  const data = JSON.stringify({
    pos: frame.position,
    tgt: frame.target,
    up: frame.up,
    yaw: frame.yaw,
    pitch: frame.pitch,
    dist: frame.distance,
    fov: frame.fov,
    dim: frame.dimension,
    proj: frame.projectionType,
    w: frame.viewportWidth,
    h: frame.viewportHeight,
  });
  return simpleHash(data);
}

export function createObserverO0(
  dimension: P51Dimension = 3,
  viewportWidth = 640,
  viewportHeight = 480
): P51ObserverFrame {
  const partial = {
    observerId: 'P51_OBSERVER_O0',
    label: 'O0 — Baseline 3D Observer',
    position: [0, 80, 260] as const,
    target: [0, 0, 0] as const,
    up: [0, 1, 0] as const,
    yaw: 0,
    pitch: 17,
    distance: 260,
    fov: 60,
    zoom: 1.0,
    dimension,
    projectionType: dimensionToProjection(dimension),
    viewportWidth,
    viewportHeight,
  };
  return Object.freeze({ ...partial, frameHash: computeFrameHash(partial) });
}

export function createObserverO1(
  dimension: P51Dimension = 3,
  viewportWidth = 640,
  viewportHeight = 480
): P51ObserverFrame {
  const partial = {
    observerId: 'P51_OBSERVER_O1',
    label: 'O1 — Translated / Shifted Observer',
    position: [150, 60, 200] as const,
    target: [5, 3, 6] as const,
    up: [0, 1, 0] as const,
    yaw: 45,
    pitch: 12,
    distance: 200,
    fov: 60,
    zoom: 1.0,
    dimension,
    projectionType: dimensionToProjection(dimension),
    viewportWidth,
    viewportHeight,
  };
  return Object.freeze({ ...partial, frameHash: computeFrameHash(partial) });
}

export function createObserverO2(
  dimension: P51Dimension = 3,
  viewportWidth = 640,
  viewportHeight = 480
): P51ObserverFrame {
  const partial = {
    observerId: 'P51_OBSERVER_O2',
    label: 'O2 — Rotated / Orbiting Observer',
    position: [-100, 150, -180] as const,
    target: [5, 3, 6] as const,
    up: [0, 1, 0] as const,
    yaw: 210,
    pitch: 35,
    distance: 300,
    fov: 45,
    zoom: 1.2,
    dimension,
    projectionType: dimensionToProjection(dimension),
    viewportWidth,
    viewportHeight,
  };
  return Object.freeze({ ...partial, frameHash: computeFrameHash(partial) });
}

export function calculateOrbitPosition(
  target: readonly [number, number, number],
  yaw: number,
  pitch: number,
  distance: number
): [number, number, number] {
  const pitchRad = (pitch * Math.PI) / 180;
  const yawRad = (yaw * Math.PI) / 180;
  const px = target[0] + distance * Math.cos(pitchRad) * Math.sin(yawRad);
  const py = target[1] + distance * Math.sin(pitchRad);
  const pz = target[2] + distance * Math.cos(pitchRad) * Math.cos(yawRad);
  return [
    Number(px.toFixed(3)),
    Number(py.toFixed(3)),
    Number(pz.toFixed(3)),
  ];
}

export function createCustomObserver(
  observerId: string,
  label: string,
  position: readonly [number, number, number] | null,
  target: readonly [number, number, number],
  yaw: number,
  pitch: number,
  distance: number,
  dimension: P51Dimension = 3,
  fov = 60,
  viewportWidth = 640,
  viewportHeight = 480
): P51ObserverFrame {
  const actualPos = position || calculateOrbitPosition(target, yaw, pitch, distance);
  const partial = {
    observerId,
    label,
    position: actualPos,
    target,
    up: [0, 1, 0] as const,
    yaw,
    pitch,
    distance,
    fov,
    zoom: 1.0,
    dimension,
    projectionType: dimensionToProjection(dimension),
    viewportWidth,
    viewportHeight,
  };
  return Object.freeze({ ...partial, frameHash: computeFrameHash(partial) });
}

function dimensionToProjection(dim: P51Dimension): P51ProjectionType {
  switch (dim) {
    case 3: return 'PERSPECTIVE_3D';
    case 2: return 'DIMENSIONAL_Z2';
    case 1: return 'DIMENSIONAL_Z1';
  }
}

