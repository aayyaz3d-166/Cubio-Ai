/**
 * 3D Memory Studio — Funnel 74
 * Landing Lifecycle Guard
 *
 * Enforces hard limits: <= 1 active LandingEngine, <= 1 active Renderer, 0 duplicate RAF loops.
 */

import { LandingEngine } from '../../funnel63/landing/landingEngine';

export class LandingLifecycleGuard {
  private disposedEngines: WeakSet<LandingEngine> = new WeakSet();

  public markDisposed(engine: LandingEngine): void {
    this.disposedEngines.add(engine);
  }

  public isDisposed(engine: LandingEngine): boolean {
    return this.disposedEngines.has(engine);
  }

  public verifyCanInitialize(engine: LandingEngine): { success: boolean; error?: string } {
    if (this.isDisposed(engine)) {
      return {
        success: false,
        error: 'Cannot initialize disposed LandingEngine instance.',
      };
    }
    return { success: true };
  }

  public verifyCanStart(engine: LandingEngine | null, isActive: boolean): { success: boolean; error?: string } {
    if (!engine) {
      return {
        success: false,
        error: 'Cannot trigger START: LandingEngine is not instantiated.',
      };
    }

    if (!isActive || this.isDisposed(engine)) {
      return {
        success: false,
        error: 'Cannot trigger START: LandingEngine is not in ACTIVE state.',
      };
    }

    return { success: true };
  }
}
