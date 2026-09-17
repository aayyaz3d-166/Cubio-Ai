/**
 * 3D Memory Studio — Funnel 68
 * Camera Coordinate Adapter (F61 integration)
 */

import { CameraEngine } from '../../funnel61/camera/cameraEngine';
import { CameraPresetType } from '../../funnel61/types';

export class CameraCoordinateAdapter {
  constructor(public readonly cameraEngine?: CameraEngine) {}

  public focusPosition(stateId: string, position: readonly [number, number, number], radius = 25): boolean {
    if (!this.cameraEngine) return true;
    this.cameraEngine.navigation.focusManager.focusState(
      this.cameraEngine.state,
      stateId,
      position,
      radius
    );
    return true;
  }

  public setPreset(preset: CameraPresetType): boolean {
    if (!this.cameraEngine) return true;
    this.cameraEngine.navigation.setPreset(this.cameraEngine.state, preset);
    return true;
  }

  public resetCamera(): boolean {
    if (!this.cameraEngine) return true;
    this.cameraEngine.navigation.resetCamera(this.cameraEngine.state);
    return true;
  }

  public fitTarget(stateId: string): boolean {
    if (!this.cameraEngine) return true;
    return this.focusPosition(stateId, [0, 0, 0], 35);
  }
}
