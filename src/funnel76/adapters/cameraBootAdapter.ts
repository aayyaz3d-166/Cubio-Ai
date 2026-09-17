/**
 * 3D Memory Studio — Funnel 76
 * Camera Boot Adapter (F61 Integration)
 */

import { CameraEngine } from '../../funnel61/camera/cameraEngine';

export class CameraBootAdapter {
  public async checkReadiness(camera?: CameraEngine): Promise<{ ready: boolean; error?: string }> {
    try {
      const activeCamera = camera ?? new CameraEngine();
      activeCamera.initialize();
      const pos = activeCamera.state.position;
      const isValid =
        Array.isArray(pos) &&
        pos.length === 3 &&
        Number.isFinite(pos[0]) &&
        Number.isFinite(pos[1]) &&
        Number.isFinite(pos[2]);

      return {
        ready: isValid,
        error: isValid ? undefined : 'Camera position is not finite',
      };
    } catch (err: any) {
      return { ready: false, error: err?.message || 'Camera check failed' };
    }
  }
}
