/**
 * 3D Memory Studio — Funnel 63
 * Master Landing Engine Coordinator
 */

import { LandingCube } from '../cube/landingCube';
import { StudioEntryManager } from '../entry/studioEntryManager';
import { GestureController } from '../interaction/gestureController';
import { CameraEngine } from '../../funnel61/camera/cameraEngine';
import { MemoryRendererHost } from '../../funnel55/renderer/rendererHost';
import { RendererLandingAdapter } from '../adapters/rendererLandingAdapter';
import { StudioShellAdapter } from '../adapters/studioShellAdapter';
import { configureLandingCamera } from '../adapters/cameraLandingAdapter';
import { LandingEngineStats, LandingMode } from '../types';

export class LandingEngine {
  public readonly cube: LandingCube;
  public readonly entryManager: StudioEntryManager;
  public readonly gestures: GestureController;
  public readonly cameraEngine: CameraEngine;
  public readonly renderer: MemoryRendererHost;
  public readonly rendererAdapter: RendererLandingAdapter;
  public readonly shellAdapter: StudioShellAdapter;

  private isDisposed = false;

  constructor() {
    this.cube = new LandingCube();
    this.entryManager = new StudioEntryManager();
    this.gestures = new GestureController();
    this.cameraEngine = new CameraEngine();
    this.renderer = new MemoryRendererHost();
    this.rendererAdapter = new RendererLandingAdapter();
    this.shellAdapter = new StudioShellAdapter();
  }

  public initialize(): void {
    if (this.isDisposed) throw new Error('Cannot initialize disposed LandingEngine.');

    this.cameraEngine.initialize();
    this.renderer.initialize();
    configureLandingCamera(this.cameraEngine);
    this.rendererAdapter.attachCube(this.cube);
  }

  public update(deltaSeconds: number): void {
    if (this.isDisposed) return;

    // 1. Update cube auto-rotation / transform
    this.cube.update(deltaSeconds);

    // 2. Update entry transition state machine
    const { mode, transitionProgress } = this.entryManager.update(deltaSeconds);

    // 3. If transitioning, scale up cube and zoom camera
    if (mode === 'ENTERING_STUDIO') {
      const transState = this.entryManager.transition.currentState;
      this.cube.state.scale = transState.scaleMultiplier;
      this.cube.syncTransform();
    }

    // 4. Update F61 camera and sync to F55 renderer
    this.cameraEngine.update(deltaSeconds);
    this.cameraEngine.syncToRenderer(this.renderer);
  }

  public startStudio(): boolean {
    return this.entryManager.requestStart();
  }

  public reset(): void {
    this.cube.reset();
    this.entryManager.resetLanding();
    configureLandingCamera(this.cameraEngine);
  }

  public getStats(): LandingEngineStats {
    return {
      mode: this.entryManager.currentMode,
      cubeRotation: [this.cube.state.rotationX, this.cube.state.rotationY, this.cube.state.rotationZ],
      cubeScale: this.cube.state.scale,
      activeFace: this.cube.state.activeFace,
      hoveredFace: this.cube.state.hoveredFace,
      startEnabled: this.entryManager.startButton.enabled,
      transitionProgress: this.entryManager.transition.currentState.progress,
    };
  }

  public dispose(): void {
    if (this.isDisposed) return;
    this.isDisposed = true;

    this.rendererAdapter.detachCube(this.cube);
    this.rendererAdapter.dispose();
    this.cube.dispose();
    this.cameraEngine.dispose();
    this.renderer.dispose();
  }
}
