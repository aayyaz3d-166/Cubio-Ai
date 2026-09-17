/**
 * 3D Memory Studio — Funnel 63
 * Camera Landing Adapter
 *
 * Configures F61 CameraEngine for the initial landing experience.
 */

import { CameraEngine } from '../../funnel61/camera/cameraEngine';

export function configureLandingCamera(cameraEngine: CameraEngine): void {
  cameraEngine.navigation.setPreset(cameraEngine.state, 'DEFAULT');
  cameraEngine.state.fov = 60;
  cameraEngine.state.mode = 'ORBIT';
}
