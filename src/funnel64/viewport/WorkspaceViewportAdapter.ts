/**
 * 3D Memory Studio — Funnel 64
 * Workspace Viewport Adapter
 *
 * Coordinates 3D viewport attachment and resizing with F55 renderer host.
 * Zero duplicate RAF loops.
 */

import { MemoryRendererHost } from '../../funnel55/renderer/rendererHost';
import { CameraEngine } from '../../funnel61/camera/cameraEngine';
import { ViewportBounds } from '../types';

export class WorkspaceViewportAdapter {
  private bounds: ViewportBounds = { x: 0, y: 0, width: 800, height: 600 };
  private canvas: HTMLCanvasElement | null = null;

  constructor(
    public readonly rendererHost: MemoryRendererHost,
    public readonly cameraEngine: CameraEngine
  ) {}

  public attachViewport(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.rendererHost.attach(canvas);
    this.rendererHost.start();
  }

  public detachViewport(): void {
    this.rendererHost.pause();
    this.canvas = null;
  }

  public setViewportBounds(bounds: ViewportBounds): void {
    this.bounds = {
      x: Math.max(0, bounds.x),
      y: Math.max(0, bounds.y),
      width: Math.max(100, bounds.width),
      height: Math.max(100, bounds.height),
    };

    if (this.canvas) {
      this.rendererHost.resize(this.bounds.width, this.bounds.height);
    }
  }

  public getViewportBounds(): ViewportBounds {
    return { ...this.bounds };
  }

  public update(deltaSeconds: number): void {
    this.cameraEngine.update(deltaSeconds);
    this.cameraEngine.syncToRenderer(this.rendererHost);
  }

  public dispose(): void {
    this.detachViewport();
  }
}
