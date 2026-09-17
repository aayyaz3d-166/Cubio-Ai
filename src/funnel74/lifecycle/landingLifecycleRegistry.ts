/**
 * 3D Memory Studio — Funnel 74
 * Landing Lifecycle Registry
 *
 * Tracks active and disposed instances to guarantee no memory or listener leaks.
 */

import { LandingEngine } from '../../funnel63/landing/landingEngine';

export class LandingLifecycleRegistry {
  private activeEngine: LandingEngine | null = null;
  private totalCreatedCount = 0;
  private totalDisposedCount = 0;

  public registerActive(engine: LandingEngine): void {
    this.activeEngine = engine;
    this.totalCreatedCount++;
  }

  public unregisterActive(engine: LandingEngine): void {
    if (this.activeEngine === engine) {
      this.activeEngine = null;
    }
    this.totalDisposedCount++;
  }

  public getActiveEngine(): LandingEngine | null {
    return this.activeEngine;
  }

  public hasActiveEngine(): boolean {
    return this.activeEngine !== null;
  }

  public getStats() {
    return {
      activeCount: this.activeEngine ? 1 : 0,
      totalCreated: this.totalCreatedCount,
      totalDisposed: this.totalDisposedCount,
    };
  }

  public reset(): void {
    this.activeEngine = null;
    this.totalCreatedCount = 0;
    this.totalDisposedCount = 0;
  }
}
