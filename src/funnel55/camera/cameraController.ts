/**
 * 3D Memory Studio — Funnel 55
 * Renderer Perspective Camera Implementation
 */

import { ICamera, CameraTransform } from './cameraTypes';

export class RendererPerspectiveCamera implements ICamera {
  public fov = 60;
  public aspect = 1.0;
  public near = 0.1;
  public far = 2000;
  public zoom = 1.0;
  public position: [number, number, number] = [0, 0, 800];
  public target: [number, number, number] = [0, 0, 0];

  constructor(fov = 60, aspect = 1.0, near = 0.1, far = 2000) {
    this.fov = fov;
    this.aspect = aspect;
    this.near = near;
    this.far = far;
  }

  public updateProjectionMatrix(): void {
    // Camera projection matrix calculation
  }

  public lookAt(x: number, y: number, z: number): void {
    this.target = [x, y, z];
  }

  public setTransform(transform: Partial<CameraTransform>): void {
    if (transform.position) this.position = [...transform.position];
    if (transform.target) this.target = [...transform.target];
    if (transform.zoom !== undefined) this.zoom = transform.zoom;
    this.updateProjectionMatrix();
  }

  public reset(): void {
    this.fov = 60;
    this.zoom = 1.0;
    this.position = [0, 0, 800];
    this.target = [0, 0, 0];
    this.updateProjectionMatrix();
  }
}
