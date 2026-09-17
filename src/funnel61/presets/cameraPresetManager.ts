/**
 * 3D Memory Studio — Funnel 61
 * Camera Preset Manager
 */

import { CameraPreset, CameraPresetType, CameraState } from '../types';
import { CAMERA_PRESETS } from './cameraPresets';
import { setOrbitYawPitch } from '../camera/orbitController';
import { setCameraDistance, setCameraFOV } from '../camera/zoomController';
import { panTo } from '../camera/panController';

export class CameraPresetManager {
  private activePreset: CameraPresetType | 'CUSTOM' = 'DEFAULT';

  public applyPreset(state: CameraState, presetType: CameraPresetType): boolean {
    const preset = CAMERA_PRESETS[presetType];
    if (!preset) return false;

    this.activePreset = presetType;
    panTo(state, preset.target);
    setOrbitYawPitch(state, preset.yaw, preset.pitch);
    setCameraDistance(state, preset.distance);
    setCameraFOV(state, preset.fov);
    state.up = [...preset.up];
    state.focusedObjectId = null;
    state.mode = presetType === 'DIMENSION' ? 'DIMENSION' : 'ORBIT';

    return true;
  }

  public get currentPreset(): CameraPresetType | 'CUSTOM' {
    return this.activePreset;
  }

  public markCustom(): void {
    this.activePreset = 'CUSTOM';
  }

  public getPreset(type: CameraPresetType): CameraPreset {
    return CAMERA_PRESETS[type];
  }

  public getAllPresets(): readonly CameraPreset[] {
    return Object.values(CAMERA_PRESETS);
  }
}
