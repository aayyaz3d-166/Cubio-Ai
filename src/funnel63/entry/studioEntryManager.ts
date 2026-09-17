/**
 * 3D Memory Studio — Funnel 63
 * Master Studio Entry State Machine Manager
 */

import { LandingMode } from '../types';
import { StartButtonController } from './startButtonController';
import { EntryTransitionController } from './entryTransition';

export class StudioEntryManager {
  private mode: LandingMode = 'LANDING';
  public readonly startButton: StartButtonController;
  public readonly transition: EntryTransitionController;

  constructor() {
    this.startButton = new StartButtonController();
    this.transition = new EntryTransitionController();
  }

  public requestStart(): boolean {
    if (this.mode !== 'LANDING') {
      return false; // Prevent duplicate transition triggers
    }

    const activated = this.startButton.triggerActivation();
    if (activated) {
      this.mode = 'START_REQUESTED';
      this.mode = 'ENTERING_STUDIO';
      this.transition.start(600);
      return true;
    }
    return false;
  }

  public update(deltaSeconds: number): { mode: LandingMode; transitionProgress: number } {
    if (this.mode === 'ENTERING_STUDIO') {
      const trans = this.transition.update(deltaSeconds);
      if (trans.isCompleted) {
        this.mode = 'STUDIO_ACTIVE';
      }
    }
    return {
      mode: this.mode,
      transitionProgress: this.transition.currentState.progress,
    };
  }

  public resetLanding(): void {
    this.mode = 'LANDING';
    this.startButton.reset();
    this.transition.reset();
  }

  public get currentMode(): LandingMode {
    return this.mode;
  }

  public isStudioActive(): boolean {
    return this.mode === 'STUDIO_ACTIVE';
  }
}
