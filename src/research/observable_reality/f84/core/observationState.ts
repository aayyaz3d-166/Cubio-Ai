/**
 * 3D Memory Studio — Funnel 84
 * Core: Observation State Generator (X + O → F)
 *
 * Invariant: FullState X is purely read-only and never modified.
 */

import { FullState, ObserverState, ObservationFrame, ObservedObject } from '../types';

export function computeFNVHash(str: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function computeStateChecksum(state: FullState): string {
  const payload = state.objects
    .map((o) => `${o.id}:${o.coordinates.map((c) => c.toFixed(4)).join(',')}`)
    .sort()
    .join('|');
  return computeFNVHash(`${state.stateId}:${state.dimension}:${payload}`);
}

export function computeObserverChecksum(obs: ObserverState): string {
  const pos = obs.position.map((c) => c.toFixed(4)).join(',');
  const orient = obs.orientation.map((c) => c.toFixed(4)).join(',');
  return computeFNVHash(`${obs.observerId}:${pos}:${orient}:${obs.zoom.toFixed(4)}:${obs.dimension}`);
}

export function computeFrameChecksum(frame: ObservationFrame): string {
  const payload = frame.relativeObjects
    .map((o) => `${o.id}:${o.relativePosition.map((c) => c.toFixed(4)).join(',')}:${o.distance.toFixed(4)}`)
    .sort()
    .join('|');
  return computeFNVHash(`${frame.frameId}:${frame.observerId}:${frame.stateId}:${payload}`);
}

export function generateObservationFrame(
  state: FullState,
  observer: ObserverState,
  options?: { frameId?: string; timestamp?: number }
): ObservationFrame {
  const [ox = 0, oy = 0, oz = 0, ow = 0] = observer.position;
  const [yawDeg = 0, pitchDeg = 0, rollDeg = 0] = observer.orientation;

  const yaw = (yawDeg * Math.PI) / 180;
  const pitch = (pitchDeg * Math.PI) / 180;

  const cosY = Math.cos(yaw);
  const sinY = Math.sin(yaw);
  const cosP = Math.cos(pitch);
  const sinP = Math.sin(pitch);

  const relativeObjects: ObservedObject[] = state.objects.map((obj) => {
    const [gx = 0, gy = 0, gz = 0, gw = 0] = obj.coordinates;

    // Translation relative to observer
    let dx = gx - ox;
    let dy = gy - oy;
    let dz = gz - oz;
    let dw = gw - ow;

    // Rotation: Yaw around Y axis
    const rx = dx * cosY + dz * sinY;
    const rz = -dx * sinY + dz * cosY;

    // Rotation: Pitch around X axis
    const ry = dy * cosP - rz * sinP;
    const finalZ = dy * sinP + rz * cosP;

    const distance = Math.hypot(rx, ry, finalZ, dw) || 0.1;
    const apparentScale = observer.zoom * (observer.focalLength / Math.max(1, distance));

    return {
      id: `OBS_${obj.id}`,
      sourceObjectId: obj.id,
      relativePosition: [
        Number(rx.toFixed(4)),
        Number(ry.toFixed(4)),
        Number(finalZ.toFixed(4)),
        Number(dw.toFixed(4)),
      ],
      distance: Number(distance.toFixed(4)),
      apparentScale: Number(apparentScale.toFixed(4)),
      visible: true,
      properties: { ...obj.properties },
    };
  });

  const frameId = options?.frameId ?? `FRAME_${observer.observerId}_${computeObserverChecksum(observer)}`;

  const partialFrame: ObservationFrame = {
    frameId,
    observerId: observer.observerId,
    stateId: state.stateId,
    relativeObjects: Object.freeze(relativeObjects),
    frameChecksum: '',
    timestamp: options?.timestamp ?? 0,
  };

  const frameChecksum = computeFrameChecksum(partialFrame);

  return Object.freeze({
    ...partialFrame,
    frameChecksum,
  });
}
