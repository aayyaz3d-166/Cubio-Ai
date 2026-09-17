/**
 * 3D Memory Studio — Funnel 73
 * Boot State Machine & Phase Transitions
 */

import { BootPhase } from '../types';

export class BootStateMachine {
  private currentPhase: BootPhase = 'UNMOUNTED';

  public getPhase(): BootPhase {
    return this.currentPhase;
  }

  public isReady(): boolean {
    return this.currentPhase === 'READY';
  }

  public isError(): boolean {
    return this.currentPhase === 'ERROR';
  }

  public transitionTo(nextPhase: BootPhase): boolean {
    if (this.currentPhase === nextPhase) return true;

    if (nextPhase === 'ERROR') {
      this.currentPhase = nextPhase;
      return true;
    }

    if (this.currentPhase === 'ERROR' && nextPhase === 'BOOTSTRAPPING') {
      this.currentPhase = nextPhase;
      return true;
    }

    this.currentPhase = nextPhase;
    return true;
  }

  public reset(): void {
    this.currentPhase = 'UNMOUNTED';
  }
}
