/**
 * 3D Memory Studio — Funnel 65
 * Camera Runtime Adapter
 */

import { CameraEngine } from '../../funnel61/camera/cameraEngine';

export class CameraRuntimeAdapter {
  constructor(public readonly cameraEngine: CameraEngine) {}

  public isCameraConnected(): boolean {
    return this.cameraEngine !== undefined && this.cameraEngine.state !== undefined;
  }

  public getMode(): string {
    return this.cameraEngine.state.mode;
  }
}
