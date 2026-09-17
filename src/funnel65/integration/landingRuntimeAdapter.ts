/**
 * 3D Memory Studio — Funnel 65
 * Landing Runtime Adapter
 */

import { LandingEngine } from '../../funnel63/landing/landingEngine';

export class LandingRuntimeAdapter {
  constructor(public readonly landingEngine: LandingEngine) {}

  public isLandingReady(): boolean {
    return this.landingEngine.entryManager.currentMode === 'LANDING';
  }

  public isStartEnabled(): boolean {
    return this.landingEngine.entryManager.startButton.enabled;
  }

  public triggerStart(): boolean {
    return this.landingEngine.startStudio();
  }
}
