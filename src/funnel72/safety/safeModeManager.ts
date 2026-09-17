/**
 * 3D Memory Studio — Funnel 72
 * Safe Mode Manager
 *
 * Coordinates running Studio in degraded safe mode when optional services fail,
 * ensuring the core 3D workspace remains usable.
 */

import { BootStageId } from '../types';

export class SafeModeManager {
  private isSafeModeActive = false;
  private unavailableServices: Set<BootStageId> = new Set();

  public enableSafeMode(failedStages: readonly BootStageId[] = []): void {
    this.isSafeModeActive = true;
    for (const stage of failedStages) {
      this.unavailableServices.add(stage);
    }
  }

  public disableSafeMode(): void {
    this.isSafeModeActive = false;
    this.unavailableServices.clear();
  }

  public isSafeMode(): boolean {
    return this.isSafeModeActive;
  }

  public isServiceAvailable(stage: BootStageId): boolean {
    return !this.unavailableServices.has(stage);
  }

  public getUnavailableServices(): readonly BootStageId[] {
    return Array.from(this.unavailableServices);
  }

  public markServiceUnavailable(stage: BootStageId): void {
    this.unavailableServices.add(stage);
  }
}
