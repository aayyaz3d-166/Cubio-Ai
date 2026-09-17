/**
 * 3D Memory Studio — Funnel 55
 * Camera Types & Abstraction
 */

export interface CameraTransform {
  position: [number, number, number];
  target: [number, number, number];
  zoom: number;
}

export interface ICamera {
  fov: number;
  aspect: number;
  near: number;
  far: number;
  zoom: number;
  position: [number, number, number];
  target: [number, number, number];
  updateProjectionMatrix(): void;
  lookAt(x: number, y: number, z: number): void;
  reset(): void;
}
