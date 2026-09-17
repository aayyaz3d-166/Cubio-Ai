/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.25-J: Viewport State & Camera View Separation
 *
 * Viewport camera, pan, zoom, orbit, and projection manager.
 * Strictly isolated: Camera state NEVER enters Geometry, Model, or Reality checksums.
 */

import { ViewportCameraState } from './types';

export class ViewportStateManager {
  private cameraState: ViewportCameraState;
  private readonly defaultState: ViewportCameraState;

  constructor(initialTarget: readonly [number, number, number] = [5, 3, 6]) {
    this.defaultState = Object.freeze({
      cameraPosition: Object.freeze([initialTarget[0] + 8, initialTarget[1] + 6, initialTarget[2] + 12] as const),
      cameraTarget: Object.freeze([initialTarget[0], initialTarget[1], initialTarget[2]] as const),
      zoom: 1.0,
      projection: 'PERSPECTIVE',
    });
    this.cameraState = { ...this.defaultState };
  }

  public getCameraState(): ViewportCameraState {
    return Object.freeze({ ...this.cameraState });
  }

  public orbit(deltaTheta: number, deltaPhi: number): void {
    const [tx, ty, tz] = this.cameraState.cameraTarget;
    const [cx, cy, cz] = this.cameraState.cameraPosition;

    const dx = cx - tx;
    const dy = cy - ty;
    const dz = cz - tz;
    const radius = Math.sqrt(dx * dx + dy * dy + dz * dz) || 10;

    let theta = Math.atan2(dx, dz) + deltaTheta;
    let phi = Math.acos(Math.max(-1, Math.min(1, dy / radius))) + deltaPhi;
    phi = Math.max(0.01, Math.min(Math.PI - 0.01, phi));

    const newX = tx + radius * Math.sin(phi) * Math.sin(theta);
    const newY = ty + radius * Math.cos(phi);
    const newZ = tz + radius * Math.sin(phi) * Math.cos(theta);

    this.cameraState = Object.freeze({
      ...this.cameraState,
      cameraPosition: Object.freeze([Number(newX.toFixed(4)), Number(newY.toFixed(4)), Number(newZ.toFixed(4))] as const),
    });
  }

  public pan(deltaX: number, deltaY: number): void {
    const [cx, cy, cz] = this.cameraState.cameraPosition;
    const [tx, ty, tz] = this.cameraState.cameraTarget;

    this.cameraState = Object.freeze({
      ...this.cameraState,
      cameraPosition: Object.freeze([cx + deltaX, cy + deltaY, cz] as const),
      cameraTarget: Object.freeze([tx + deltaX, ty + deltaY, tz] as const),
    });
  }

  public zoom(factor: number): void {
    const newZoom = Math.max(0.1, Math.min(10.0, this.cameraState.zoom * factor));
    this.cameraState = Object.freeze({
      ...this.cameraState,
      zoom: Number(newZoom.toFixed(4)),
    });
  }

  public setProjection(projection: 'PERSPECTIVE' | 'ORTHOGRAPHIC'): void {
    this.cameraState = Object.freeze({
      ...this.cameraState,
      projection,
    });
  }

  public resetView(target?: readonly [number, number, number]): void {
    if (target) {
      this.cameraState = Object.freeze({
        cameraPosition: Object.freeze([target[0] + 8, target[1] + 6, target[2] + 12] as const),
        cameraTarget: Object.freeze([target[0], target[1], target[2]] as const),
        zoom: 1.0,
        projection: 'PERSPECTIVE',
      });
    } else {
      this.cameraState = { ...this.defaultState };
    }
  }
}
