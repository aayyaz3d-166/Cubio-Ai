/**
 * 3D Memory Studio — Funnel 55
 * Master 3D Renderer Host
 *
 * Implements deterministic renderer lifecycle:
 * CREATE -> INITIALIZE -> ATTACH -> RUNNING -> PAUSED -> RESUMED -> DISPOSED
 */

import {
  RendererCapabilities,
  RendererLifecycleState,
  RendererQuality,
  RendererStats,
  RendererViewport,
  RendererBackendType,
} from '../types';
import { detectRendererCapabilities } from './rendererCapabilities';
import { RendererResourceRegistry } from './rendererResources';
import { RendererStatsTracker } from './rendererStats';
import { RendererLoop } from './rendererLoop';
import { MemoryScene } from '../scene/memoryScene';
import { RendererPerspectiveCamera } from '../camera/cameraController';
import { FallbackCanvas2DRenderer } from '../fallback/fallbackRenderer';

export interface RendererHostOptions {
  quality?: RendererQuality;
  boundedDpr?: number;
  autoStart?: boolean;
}

export class MemoryRendererHost {
  private lifecycleState: RendererLifecycleState = 'UNINITIALIZED';
  public readonly capabilities: RendererCapabilities;
  public readonly resources: RendererResourceRegistry;
  public readonly statsTracker: RendererStatsTracker;
  public readonly loop: RendererLoop;
  public readonly scene: MemoryScene;
  public readonly camera: RendererPerspectiveCamera;
  public readonly fallback: FallbackCanvas2DRenderer;

  private canvas: HTMLCanvasElement | null = null;
  private quality: RendererQuality = 'MEDIUM';
  private viewport: RendererViewport = {
    width: 800,
    height: 600,
    dpr: 1.0,
    aspect: 800 / 600,
  };
  private attachedScene: { update: (deltaMs: number, timeMs: number) => void; render: (context: unknown) => void; getTotalObjectCount?: () => number; registry?: { count: number } } | null = null;
  private attachedCamera: { state?: { position: [number, number, number]; target: [number, number, number]; distance?: number; up?: [number, number, number]; fov?: number }; target?: [number, number, number]; position?: [number, number, number]; up?: [number, number, number]; fov?: number; distance?: number; zoom?: number } | null = null;
  private isDisposed = false;

  constructor(options: RendererHostOptions = {}) {
    this.capabilities = detectRendererCapabilities();
    this.resources = new RendererResourceRegistry();
    this.statsTracker = new RendererStatsTracker();
    this.loop = new RendererLoop();
    this.scene = new MemoryScene();
    this.camera = new RendererPerspectiveCamera();
    this.fallback = new FallbackCanvas2DRenderer();

    this.quality = options.quality || this.capabilities.recommendedQuality;
    const initialDpr = Math.min(
      this.capabilities.maxBoundedDpr,
      options.boundedDpr || this.capabilities.maxBoundedDpr
    );

    this.viewport = {
      width: 800,
      height: 600,
      dpr: initialDpr,
      aspect: 800 / 600,
    };
  }

  public setAttachedScene(scene: { update: (deltaMs: number, timeMs: number) => void; render: (context: unknown) => void; getTotalObjectCount?: () => number; registry?: { count: number } } | null): void {
    this.attachedScene = scene;
  }

  public getAttachedScene(): { update: (deltaMs: number, timeMs: number) => void; render: (context: unknown) => void } | null {
    return this.attachedScene;
  }

  public setAttachedCamera(camera: any): void {
    this.attachedCamera = camera;
  }

  public getAttachedCamera(): any {
    return this.attachedCamera;
  }

  public getProjectedDiagnostics(): readonly import('../types').ProjectedObjectDiagnostic[] {
    return this.fallback.getDiagnostics();
  }

  public initialize(): void {
    if (this.isDisposed) throw new Error('Cannot initialize disposed renderer host.');
    if (this.lifecycleState !== 'UNINITIALIZED') return;

    this.lifecycleState = 'INITIALIZED';
  }

  public attach(canvasElement: unknown): void {
    if (this.isDisposed) throw new Error('Cannot attach canvas to disposed renderer host.');
    this.initialize();

    if (canvasElement && typeof (canvasElement as HTMLCanvasElement).getContext === 'function') {
      this.canvas = canvasElement as HTMLCanvasElement;
      this.fallback.initialize(this.canvas);
    }

    this.lifecycleState = 'ATTACHED';
    this.resize(this.viewport.width, this.viewport.height, this.viewport.dpr);
  }

  public start(): void {
    if (this.isDisposed || this.lifecycleState === 'RUNNING') return;

    this.initialize();

    this.loop.start((deltaMs, timeMs) => {
      this.renderFrame(deltaMs, timeMs);
    });

    this.lifecycleState = 'RUNNING';
  }

  public pause(): void {
    if (this.lifecycleState !== 'RUNNING') return;
    this.loop.pause();
    this.lifecycleState = 'PAUSED';
  }

  public resume(): void {
    if (this.lifecycleState !== 'PAUSED') return;
    this.loop.resume();
    this.lifecycleState = 'RUNNING';
  }

  public resize(width: number, height: number, customDpr?: number): void {
    const validWidth = Math.max(1, width);
    const validHeight = Math.max(1, height);
    const dpr = Math.min(
      this.capabilities.maxBoundedDpr,
      customDpr !== undefined ? customDpr : this.viewport.dpr
    );

    this.viewport = Object.freeze({
      width: validWidth,
      height: validHeight,
      dpr,
      aspect: validWidth / validHeight,
    });

    this.camera.aspect = this.viewport.aspect;
    this.camera.updateProjectionMatrix();

    this.fallback.resize(this.viewport);
  }

  public render(): void {
    this.renderFrame(16.6, performance.now());
  }

  private renderFrame(deltaMs: number, timeMs: number): void {
    if (this.isDisposed) return;

    const frameStart = this.statsTracker.beginFrame();

    // 1. Update active scene hierarchy
    if (this.attachedScene) {
      this.attachedScene.update(deltaMs, timeMs);
    } else {
      this.scene.update(deltaMs, timeMs);
    }

    // 2. Render backend with active scene and camera
    const activeScene = this.attachedScene || this.scene;
    const activeCam = this.attachedCamera
      ? (this.attachedCamera.state
          ? {
              target: this.attachedCamera.state.target,
              position: this.attachedCamera.state.position,
              up: this.attachedCamera.state.up,
              fov: this.attachedCamera.state.fov,
              distance: this.attachedCamera.state.distance,
              zoom: (this.attachedCamera.state as any).distance ? 90 / (this.attachedCamera.state as any).distance : 1.0,
            }
          : this.attachedCamera)
      : this.camera;

    this.fallback.render(activeScene as any, activeCam as any);

    // 3. Complete frame stats
    const activeCount = this.attachedScene
      ? (this.attachedScene.registry?.count ?? (typeof (this.attachedScene as any).getTotalObjectCount === 'function' ? (this.attachedScene as any).getTotalObjectCount() : 1))
      : this.scene.getTotalObjectCount();
    this.statsTracker.endFrame(frameStart, Math.max(1, activeCount));
  }

  public getStats(): RendererStats {
    const activeObjects = this.attachedScene
      ? (this.attachedScene.registry?.count ?? (typeof (this.attachedScene as any).getTotalObjectCount === 'function' ? (this.attachedScene as any).getTotalObjectCount() : 0))
      : this.scene.getTotalObjectCount();
    const activeResources = this.resources.getActiveCount();

    return this.statsTracker.getStats(
      activeObjects,
      activeResources,
      this.viewport.width,
      this.viewport.height,
      this.viewport.dpr,
      this.quality,
      this.capabilities.rendererType,
      this.capabilities.webglAvailable
    );
  }

  public get state(): RendererLifecycleState {
    return this.lifecycleState;
  }

  public get currentViewport(): RendererViewport {
    return this.viewport;
  }

  public dispose(): void {
    if (this.isDisposed) return;
    this.isDisposed = true;
    this.lifecycleState = 'DISPOSED';

    this.loop.stop();
    this.attachedScene = null;
    this.scene.dispose();
    this.fallback.dispose();
    this.resources.disposeAll();
    this.canvas = null;
  }
}
