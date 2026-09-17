/**
 * 3D Memory Studio — Funnel 51
 * Simulation Lifecycle Controller & Animation Loop Manager
 *
 * Provides a clean, leak-free animation loop with deterministic frame delta clamping
 * and immediate cancelAnimationFrame on unmount.
 */

import { SimulationExperienceState } from '../types';
import {
  createInitialSimulationState,
  stepSimulationState,
  startSimulation,
  pauseSimulation,
  resumeSimulation,
  restartSimulation,
  skipSimulation,
  enterStudioState,
} from '../state';

export type StateUpdateListener = (state: SimulationExperienceState) => void;

const safeRaf =
  typeof requestAnimationFrame !== 'undefined'
    ? requestAnimationFrame
    : (cb: (t: number) => void) => (setTimeout(() => cb(performance.now()), 16) as unknown as number);

const safeCaf =
  typeof cancelAnimationFrame !== 'undefined'
    ? cancelAnimationFrame
    : (id: number) => clearTimeout(id as unknown as NodeJS.Timeout);

export class SimulationSequenceController {
  private state: SimulationExperienceState;
  private listeners = new Set<StateUpdateListener>();
  private rafId: number | null = null;
  private lastTimeMs: number | null = null;
  private isDestroyed = false;

  constructor(prefersReducedMotion = false) {
    this.state = createInitialSimulationState(prefersReducedMotion);
  }

  public getState(): SimulationExperienceState {
    return this.state;
  }

  public subscribe(listener: StateUpdateListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    if (this.isDestroyed) return;
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }

  public start(): void {
    if (this.isDestroyed) return;
    this.state = startSimulation(this.state);
    this.notify();
    this.startLoop();
  }

  public pause(): void {
    this.state = pauseSimulation(this.state);
    this.notify();
    this.stopLoop();
  }

  public resume(): void {
    if (this.isDestroyed) return;
    this.state = resumeSimulation(this.state);
    this.notify();
    this.startLoop();
  }

  public restart(): void {
    this.stopLoop();
    this.state = restartSimulation(this.state);
    this.notify();
  }

  public skip(): void {
    this.stopLoop();
    this.state = skipSimulation(this.state);
    this.notify();
  }

  public enterStudio(): void {
    this.stopLoop();
    this.state = enterStudioState(this.state);
    this.notify();
  }

  public setReducedMotion(enabled: boolean): void {
    this.state = Object.freeze({
      ...this.state,
      prefersReducedMotion: enabled,
    });
    this.notify();
  }

  private startLoop(): void {
    if (this.rafId !== null || this.isDestroyed) return;

    this.lastTimeMs = performance.now();
    const tick = (now: number) => {
      if (this.isDestroyed) return;

      const last = this.lastTimeMs ?? now;
      const delta = Math.min(50, Math.max(0, now - last)); // Clamp delta to max 50ms
      this.lastTimeMs = now;

      if (this.state.isRunning && !this.state.isPaused && !this.state.isCompleted) {
        this.state = stepSimulationState(this.state, delta);
        this.notify();

        if (!this.state.isCompleted) {
          this.rafId = safeRaf(tick);
          return;
        }
      }

      this.rafId = null;
    };

    this.rafId = safeRaf(tick);
  }

  private stopLoop(): void {
    if (this.rafId !== null) {
      safeCaf(this.rafId);
      this.rafId = null;
    }
    this.lastTimeMs = null;
  }

  public destroy(): void {
    this.isDestroyed = true;
    this.stopLoop();
    this.listeners.clear();
  }
}
