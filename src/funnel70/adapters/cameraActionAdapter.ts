/**
 * 3D Memory Studio — Funnel 70
 * Camera Action Adapter (F61 Integration)
 */

import { CameraEngine } from '../../funnel61/camera/cameraEngine';
import { CameraPresetType } from '../../funnel61/types';
import { SecurityActionAdapter } from './securityActionAdapter';
import { VALID_CAMERA_PRESETS } from '../actions/actionTypes';

export class CameraActionAdapter {
  private activePreset: CameraPresetType = 'DEFAULT';
  private lastFocusedTarget: string | null = null;

  constructor(
    public readonly cameraEngine?: CameraEngine,
    private readonly security: SecurityActionAdapter = new SecurityActionAdapter()
  ) {}

  public focusState(
    stateId: string,
    position: readonly [number, number, number] = [0, 0, 0],
    radius = 25
  ): boolean {
    if (!this.security.isTargetPermitted(stateId)) return false;
    this.lastFocusedTarget = stateId;
    if (this.cameraEngine) {
      this.cameraEngine.navigation.focusManager.focusState(
        this.cameraEngine.state,
        stateId,
        position,
        radius
      );
    }
    return true;
  }

  public focusCluster(
    clusterId: string,
    center: readonly [number, number, number] = [0, 0, 0],
    radius = 60
  ): boolean {
    if (!this.security.isTargetPermitted(clusterId)) return false;
    this.lastFocusedTarget = clusterId;
    if (this.cameraEngine) {
      this.cameraEngine.navigation.focusManager.focusState(
        this.cameraEngine.state,
        clusterId,
        center,
        radius
      );
    }
    return true;
  }

  public focusRelationship(
    relationshipId: string,
    midpoint: readonly [number, number, number] = [0, 0, 0],
    radius = 40
  ): boolean {
    if (!this.security.isTargetPermitted(relationshipId)) return false;
    this.lastFocusedTarget = relationshipId;
    if (this.cameraEngine) {
      this.cameraEngine.navigation.focusManager.focusState(
        this.cameraEngine.state,
        relationshipId,
        midpoint,
        radius
      );
    }
    return true;
  }

  public setPreset(preset: CameraPresetType): boolean {
    if (!VALID_CAMERA_PRESETS.has(preset)) return false;
    this.activePreset = preset;
    if (this.cameraEngine) {
      this.cameraEngine.navigation.setPreset(this.cameraEngine.state, preset);
    }
    return true;
  }

  public resetCamera(): boolean {
    this.activePreset = 'DEFAULT';
    this.lastFocusedTarget = null;
    if (this.cameraEngine) {
      this.cameraEngine.navigation.resetCamera(this.cameraEngine.state);
    }
    return true;
  }

  public fitSelected(targetId?: string): boolean {
    const target = targetId ?? this.lastFocusedTarget ?? 'TARGET';
    if (!this.security.isTargetPermitted(target)) return false;
    return this.focusState(target, [0, 0, 0], 35);
  }

  public getActivePreset(): CameraPresetType {
    return this.activePreset;
  }

  public getLastFocusedTarget(): string | null {
    return this.lastFocusedTarget;
  }
}
