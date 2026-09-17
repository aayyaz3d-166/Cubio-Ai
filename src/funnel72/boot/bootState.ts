/**
 * 3D Memory Studio — Funnel 72
 * Boot State Machine & Transition Rules
 */

import { BootState } from '../types';

export class BootStateMachine {
  private currentState: BootState = 'IDLE';

  public getState(): BootState {
    return this.currentState;
  }

  public transitionTo(nextState: BootState): boolean {
    if (this.currentState === 'DISPOSED' && nextState !== 'DISPOSED') {
      return false; // Cannot transition out of DISPOSED
    }

    switch (this.currentState) {
      case 'IDLE':
        if (nextState === 'BOOTING' || nextState === 'DISPOSED') {
          this.currentState = nextState;
          return true;
        }
        return false;

      case 'BOOTING':
        if (
          nextState === 'READY' ||
          nextState === 'DEGRADED' ||
          nextState === 'FAILED' ||
          nextState === 'DISPOSED'
        ) {
          this.currentState = nextState;
          return true;
        }
        return false;

      case 'READY':
      case 'DEGRADED':
      case 'FAILED':
        if (nextState === 'BOOTING' || nextState === 'DISPOSED' || nextState === 'READY' || nextState === 'DEGRADED') {
          this.currentState = nextState;
          return true;
        }
        return false;

      default:
        return false;
    }
  }

  public reset(): void {
    this.currentState = 'IDLE';
  }
}
