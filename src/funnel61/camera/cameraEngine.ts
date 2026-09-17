/**
 * 3D Memory Studio — Funnel 61
 * Master Camera & Navigation Engine
 */

import { CameraState, CameraEngineStats } from '../types';
import { createDefaultCameraState } from './cameraState';
import { NavigationController } from '../navigation/navigationController';
import { MemoryRendererHost } from '../../funnel55/renderer/rendererHost';
import { applyCameraStateToThreeCamera } from '../adapters/rendererCameraAdapter';

export class CameraEngine {
  public readonly state: CameraState;
  public readonly navigation: NavigationController;
  private isDisposed = false;

  constructor() {
    this.state = createDefaultCameraState();
    this.navigation = new NavigationController();
  }

  public initialize(): void {
    if (this.isDisposed) throw new Error('Cannot initialize disposed CameraEngine.');
  }

  public update(deltaSeconds: number): void {
    if (this.isDisposed) return;
    this.navigation.update(this.state, deltaSeconds);
  }

  public syncToRenderer(rendererHost: MemoryRendererHost): void {
    if (this.isDisposed) return;
    applyCameraStateToThreeCamera(this.state, rendererHost.camera);
  }

  public getStats(): CameraEngineStats {
    return {
      mode: this.state.mode,
      position: Object.freeze([...this.state.position]),
      target: Object.freeze([...this.state.target]),
      distance: this.state.distance,
      yaw: this.state.yaw,
      pitch: this.state.pitch,
      fov: this.state.fov,
      activeDimension: this.state.dimension,
      isComputationalProjection: this.state.dimension > 3,
      focusedObjectId: this.state.focusedObjectId,
      isTransitioning: this.state.isTransitioning,
      currentPreset: this.navigation.presetManager.currentPreset,
      historyCount: this.navigation.history.count,
    };
  }

  public dispose(): void {
    if (this.isDisposed) return;
    this.isDisposed = true;
    this.navigation.history.clear();
  }
}
