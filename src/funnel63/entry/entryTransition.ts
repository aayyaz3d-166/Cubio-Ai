/**
 * 3D Memory Studio — Funnel 63
 * Deterministic Entry Transition Controller
 */

import { LandingTransitionState } from '../types';

export class EntryTransitionController {
  private state: LandingTransitionState = {
    progress: 0.0,
    durationMs: 600,
    elapsedMs: 0,
    scaleMultiplier: 1.0,
    opacityMultiplier: 1.0,
    isCompleted: false,
  };
  private isRunning = false;

  public start(durationMs = 600): void {
    if (this.isRunning) return; // Prevent duplicate transition starts
    this.isRunning = true;
    this.state.durationMs = Math.max(100, durationMs);
    this.state.elapsedMs = 0;
    this.state.progress = 0.0;
    this.state.scaleMultiplier = 1.0;
    this.state.opacityMultiplier = 1.0;
    this.state.isCompleted = false;
  }

  public update(deltaSeconds: number): LandingTransitionState {
    if (!this.isRunning) {
      return { ...this.state };
    }

    this.state.elapsedMs += deltaSeconds * 1000;
    const rawProgress = Math.min(1.0, this.state.elapsedMs / this.state.durationMs);

    // Deterministic cubic smoothstep easing: 3p^2 - 2p^3
    this.state.progress = rawProgress * rawProgress * (3 - 2 * rawProgress);

    this.state.scaleMultiplier = 1.0 + this.state.progress * 2.0; // 1.0 -> 3.0
    this.state.opacityMultiplier = Math.max(0.0, 1.0 - this.state.progress); // 1.0 -> 0.0

    if (rawProgress >= 1.0) {
      this.state.isCompleted = true;
      this.isRunning = false;
    }

    return { ...this.state };
  }

  public reset(): void {
    this.isRunning = false;
    this.state.progress = 0.0;
    this.state.elapsedMs = 0;
    this.state.scaleMultiplier = 1.0;
    this.state.opacityMultiplier = 1.0;
    this.state.isCompleted = false;
  }

  public get running(): boolean {
    return this.isRunning;
  }

  public get currentState(): LandingTransitionState {
    return { ...this.state };
  }
}
