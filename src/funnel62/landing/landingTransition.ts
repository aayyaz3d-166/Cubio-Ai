/**
 * 3D Memory Studio — Funnel 62
 * Landing ↔ Studio Deterministic Transition Controller
 */

export class LandingTransitionController {
  private progress = 0; // 0.0 to 1.0
  private isTransitioning = false;
  private durationMs = 600;
  private elapsedMs = 0;

  public startTransition(durationMs = 600): void {
    this.isTransitioning = true;
    this.durationMs = Math.max(100, durationMs);
    this.elapsedMs = 0;
    this.progress = 0;
  }

  public update(deltaSeconds: number): { isCompleted: boolean; progress: number; scale: number; opacity: number } {
    if (!this.isTransitioning) {
      return { isCompleted: this.progress >= 1.0, progress: this.progress, scale: 1.0, opacity: 1.0 };
    }

    this.elapsedMs += deltaSeconds * 1000;
    const rawProgress = Math.min(1.0, this.elapsedMs / this.durationMs);

    // Cubic smoothstep easing
    this.progress = rawProgress * rawProgress * (3 - 2 * rawProgress);

    const scale = 1.0 + this.progress * 2.5;
    const opacity = Math.max(0, 1.0 - this.progress);

    const isCompleted = rawProgress >= 1.0;
    if (isCompleted) {
      this.isTransitioning = false;
    }

    return {
      isCompleted,
      progress: this.progress,
      scale,
      opacity,
    };
  }

  public get currentProgress(): number {
    return this.progress;
  }

  public get active(): boolean {
    return this.isTransitioning;
  }

  public reset(): void {
    this.progress = 0;
    this.isTransitioning = false;
    this.elapsedMs = 0;
  }
}
