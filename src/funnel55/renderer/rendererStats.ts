/**
 * 3D Memory Studio — Funnel 55
 * Renderer Performance & Telemetry Tracker
 */

import { RendererStats, RendererQuality, RendererBackendType } from '../types';

export class RendererStatsTracker {
  private lastTime = performance.now();
  private frameCount = 0;
  private fps = 60;
  private lastFpsUpdate = performance.now();
  private frameTimeMs = 16.6;
  private frameDeltaMs = 16.6;
  private renderCalls = 0;

  public beginFrame(): number {
    return performance.now();
  }

  public endFrame(
    frameStartTime: number,
    renderCalls = 1
  ): { deltaMs: number; frameTimeMs: number } {
    const now = performance.now();
    const rawDelta = now - this.lastTime;
    // Strict delta clamping: max 50ms (prevents browser tab sleep jumps)
    this.frameDeltaMs = Math.min(50, Math.max(1, rawDelta));
    this.lastTime = now;

    this.frameTimeMs = Math.max(0.1, now - frameStartTime);
    this.renderCalls = renderCalls;

    // Update FPS once every 500ms
    this.frameCount++;
    if (now - this.lastFpsUpdate >= 500) {
      this.fps = Math.round((this.frameCount * 1000) / (now - this.lastFpsUpdate));
      this.frameCount = 0;
      this.lastFpsUpdate = now;
    }

    return { deltaMs: this.frameDeltaMs, frameTimeMs: this.frameTimeMs };
  }

  public getStats(
    activeObjects: number,
    activeResources: number,
    canvasWidth: number,
    canvasHeight: number,
    dpr: number,
    quality: RendererQuality,
    rendererType: RendererBackendType,
    webglAvailable: boolean
  ): RendererStats {
    return Object.freeze({
      fps: this.fps,
      frameTimeMs: Number(this.frameTimeMs.toFixed(2)),
      frameDeltaMs: Number(this.frameDeltaMs.toFixed(2)),
      renderCalls: this.renderCalls,
      activeObjects,
      activeResources,
      canvasWidth,
      canvasHeight,
      dpr,
      quality,
      rendererType,
      webglAvailable,
    });
  }

  public reset(): void {
    this.lastTime = performance.now();
    this.frameCount = 0;
    this.fps = 60;
    this.lastFpsUpdate = performance.now();
    this.frameTimeMs = 16.6;
    this.frameDeltaMs = 16.6;
    this.renderCalls = 0;
  }
}
