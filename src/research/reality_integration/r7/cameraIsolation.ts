/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R7: Camera Isolation Engine
 *
 * Manages viewport camera presets, zoom, pan, and orbit.
 * Invariant: Camera mutations NEVER alter Reality state (Delta Reality = 0).
 */

import { R7CameraState, R7ViewPreset } from './types';

export class CameraIsolationEngine {
  public static readonly DEFAULT_CAMERA: R7CameraState = Object.freeze({
    position: Object.freeze([0, -10, 5] as [number, number, number]),
    target: Object.freeze([5, 3, 6] as [number, number, number]), // Focus on canonical coordinate contract
    zoom: 1.0,
    orbitAngle: 0.0,
    viewPreset: 'PERSPECTIVE',
  });

  public static applyPreset(preset: R7ViewPreset, target: readonly [number, number, number] = [5, 3, 6]): R7CameraState {
    const [tx, ty, tz] = target;

    switch (preset) {
      case 'TOP':
        return Object.freeze({
          position: Object.freeze([tx, ty, tz + 15] as [number, number, number]),
          target: Object.freeze([tx, ty, tz] as [number, number, number]),
          zoom: 1.0,
          orbitAngle: 0,
          viewPreset: 'TOP',
        });
      case 'FRONT':
        return Object.freeze({
          position: Object.freeze([tx, ty - 15, tz] as [number, number, number]),
          target: Object.freeze([tx, ty, tz] as [number, number, number]),
          zoom: 1.0,
          orbitAngle: 0,
          viewPreset: 'FRONT',
        });
      case 'SIDE':
        return Object.freeze({
          position: Object.freeze([tx + 15, ty, tz] as [number, number, number]),
          target: Object.freeze([tx, ty, tz] as [number, number, number]),
          zoom: 1.0,
          orbitAngle: 90,
          viewPreset: 'SIDE',
        });
      case 'ISOMETRIC':
        return Object.freeze({
          position: Object.freeze([tx + 10, ty - 10, tz + 10] as [number, number, number]),
          target: Object.freeze([tx, ty, tz] as [number, number, number]),
          zoom: 1.0,
          orbitAngle: 45,
          viewPreset: 'ISOMETRIC',
        });
      case 'PERSPECTIVE':
      default:
        return Object.freeze({
          position: Object.freeze([tx, ty - 10, tz + 5] as [number, number, number]),
          target: Object.freeze([tx, ty, tz] as [number, number, number]),
          zoom: 1.0,
          orbitAngle: 0,
          viewPreset: 'PERSPECTIVE',
        });
    }
  }

  public static adjustZoom(currentCamera: R7CameraState, delta: number): R7CameraState {
    const newZoom = Math.max(0.1, currentCamera.zoom + delta);
    return Object.freeze({
      ...currentCamera,
      zoom: newZoom,
    });
  }

  public static adjustOrbit(currentCamera: R7CameraState, angleDelta: number): R7CameraState {
    const newAngle = (currentCamera.orbitAngle + angleDelta) % 360;
    return Object.freeze({
      ...currentCamera,
      orbitAngle: newAngle,
    });
  }
}
