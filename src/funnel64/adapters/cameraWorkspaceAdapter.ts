/**
 * 3D Memory Studio — Funnel 64
 * Camera Workspace Adapter
 *
 * Exposes F61 Camera & Navigation Engine focus and presets.
 */

import { CameraEngine } from '../../funnel61/camera/cameraEngine';
import { CameraPresetType } from '../../funnel61/types';

export class CameraWorkspaceAdapter {
  constructor(public readonly cameraEngine: CameraEngine) {}

  public focusState(stateId: string, position: readonly [number, number, number], radius = 20): void {
    this.cameraEngine.navigation.focusManager.focusState(
      this.cameraEngine.state,
      stateId,
      position,
      radius
    );
  }

  public setPreset(preset: CameraPresetType): void {
    this.cameraEngine.navigation.setPreset(this.cameraEngine.state, preset);
  }

  public resetCamera(): void {
    this.cameraEngine.navigation.resetCamera(this.cameraEngine.state);
  }

  public get cameraMode(): string {
    return this.cameraEngine.state.mode;
  }
}
