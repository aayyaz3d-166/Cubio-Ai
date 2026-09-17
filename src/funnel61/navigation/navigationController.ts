/**
 * 3D Memory Studio — Funnel 61
 * Master Navigation Controller
 */

import { CameraState, CameraPresetType } from '../types';
import { rotateHorizontal, rotateVertical, setOrbitYawPitch, recalculateOrbitPosition } from '../camera/orbitController';
import { panScreen, panWorld, panTo } from '../camera/panController';
import { zoomCamera, setCameraDistance } from '../camera/zoomController';
import { CameraFocusManager } from '../focus/cameraFocusManager';
import { CameraPresetManager } from '../presets/cameraPresetManager';
import { CameraTransitionManager } from '../transition/cameraTransitionManager';
import { CameraHistory } from '../history/cameraHistory';
import { CameraTargetManager } from '../camera/cameraTargetManager';
import { createDefaultCameraState } from '../camera/cameraState';
import { NavigationAction } from './navigationInputAdapter';

export class NavigationController {
  public readonly focusManager: CameraFocusManager;
  public readonly presetManager: CameraPresetManager;
  public readonly transitionManager: CameraTransitionManager;
  public readonly targetManager: CameraTargetManager;
  public readonly history: CameraHistory;

  constructor() {
    this.focusManager = new CameraFocusManager();
    this.presetManager = new CameraPresetManager();
    this.transitionManager = new CameraTransitionManager();
    this.targetManager = new CameraTargetManager();
    this.history = new CameraHistory();
  }

  public orbit(state: CameraState, deltaYaw: number, deltaPitch: number): void {
    this.transitionManager.cancel(state);
    this.presetManager.markCustom();
    state.mode = 'ORBIT';
    rotateHorizontal(state, deltaYaw);
    rotateVertical(state, deltaPitch);
  }

  public pan(state: CameraState, deltaX: number, deltaY: number): void {
    this.transitionManager.cancel(state);
    this.presetManager.markCustom();
    state.mode = 'PAN';
    panScreen(state, deltaX, deltaY);
  }

  public zoom(state: CameraState, deltaDistance: number): void {
    this.transitionManager.cancel(state);
    this.presetManager.markCustom();
    state.mode = 'ZOOM';
    zoomCamera(state, deltaDistance);
  }

  public setPreset(state: CameraState, preset: CameraPresetType): void {
    this.history.save(state);
    this.transitionManager.cancel(state);
    this.presetManager.applyPreset(state, preset);
  }

  public resetCamera(state: CameraState): void {
    this.history.save(state);
    this.transitionManager.cancel(state);
    const def = createDefaultCameraState();
    state.position = [...def.position];
    state.target = [...def.target];
    state.up = [...def.up];
    state.distance = def.distance;
    state.yaw = def.yaw;
    state.pitch = def.pitch;
    state.fov = def.fov;
    state.mode = 'ORBIT';
    state.focusedObjectId = null;
    this.targetManager.clearTarget();
    this.presetManager.markCustom();
    recalculateOrbitPosition(state);
  }

  public dispatchAction(state: CameraState, action: NavigationAction): void {
    switch (action.type) {
      case 'ORBIT':
        this.orbit(state, action.deltaYaw, action.deltaPitch);
        break;
      case 'PAN':
        this.pan(state, action.deltaX, action.deltaY);
        break;
      case 'ZOOM':
        this.zoom(state, action.deltaDistance);
        break;
      case 'FOCUS':
        this.history.save(state);
        this.focusManager.focusState(state, action.targetId, action.position, action.radius);
        break;
      case 'PRESET':
        this.setPreset(state, action.preset);
        break;
      case 'RESET':
        this.resetCamera(state);
        break;
    }
  }

  public update(state: CameraState, deltaSeconds: number): void {
    this.transitionManager.update(state, deltaSeconds);
  }
}
