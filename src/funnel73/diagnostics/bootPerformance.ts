/**
 * 3D Memory Studio — Funnel 73
 * Boot Performance Metrics Collector
 */

import { BootPerformanceMetrics, BootPhase } from '../types';

export class BootPerformanceCollector {
  private phaseDurations: Map<BootPhase, number> = new Map();
  private totalStartTime = 0;
  private totalEndTime = 0;

  public startTotal(): void {
    this.totalStartTime = performance.now();
    this.totalEndTime = 0;
  }

  public endTotal(): void {
    this.totalEndTime = performance.now();
  }

  public recordPhaseDuration(phase: BootPhase, durationMs: number): void {
    this.phaseDurations.set(phase, durationMs);
  }

  public getMetrics(): BootPerformanceMetrics {
    const totalBootDurationMs =
      this.totalEndTime > 0
        ? this.totalEndTime - this.totalStartTime
        : performance.now() - this.totalStartTime;

    return {
      totalBootDurationMs: Math.max(0, totalBootDurationMs),
      rootMountDurationMs: this.phaseDurations.get('ROOT_READY') || 0,
      rendererCheckDurationMs: this.phaseDurations.get('CHECKING_RENDERER') || 0,
      sceneCheckDurationMs: this.phaseDurations.get('CHECKING_SCENE') || 0,
      studioCheckDurationMs: this.phaseDurations.get('CHECKING_STUDIO') || 0,
      f72ActivationDurationMs: this.phaseDurations.get('ACTIVATING_F72') || 0,
    };
  }

  public reset(): void {
    this.phaseDurations.clear();
    this.totalStartTime = 0;
    this.totalEndTime = 0;
  }
}
