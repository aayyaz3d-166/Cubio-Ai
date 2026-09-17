/**
 * 3D Memory Studio — Funnel 65
 * Runtime State Machine & Transition Logic
 */

import { RuntimeStateMode } from '../types';

export class RuntimeStateMachine {
  private currentMode: RuntimeStateMode = 'BOOTING';

  private readonly validTransitions: Record<RuntimeStateMode, readonly RuntimeStateMode[]> = {
    BOOTING: ['LANDING', 'ERROR', 'DISPOSED'],
    LANDING: ['STARTING_STUDIO', 'ERROR', 'DISPOSED'],
    STARTING_STUDIO: ['STUDIO_ACTIVE', 'ERROR', 'DISPOSED'],
    STUDIO_ACTIVE: ['LANDING', 'ERROR', 'DISPOSED'],
    ERROR: ['BOOTING', 'LANDING', 'DISPOSED'],
    DISPOSED: [],
  };

  public canTransitionTo(target: RuntimeStateMode): boolean {
    return this.validTransitions[this.currentMode].includes(target);
  }

  public transitionTo(target: RuntimeStateMode): boolean {
    if (!this.canTransitionTo(target)) {
      return false;
    }
    this.currentMode = target;
    return true;
  }

  public get mode(): RuntimeStateMode {
    return this.currentMode;
  }

  public reset(): void {
    this.currentMode = 'BOOTING';
  }
}
