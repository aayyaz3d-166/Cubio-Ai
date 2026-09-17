/**
 * 3D Memory Studio — Funnel 77
 * Viewport State Machine
 */

import { ViewportState } from '../types';

export class ViewportStateMachine {
  private currentState: ViewportState = 'WAITING';

  public getState(): ViewportState {
    return this.currentState;
  }

  public isActive(): boolean {
    return this.currentState === 'ACTIVE';
  }

  public isError(): boolean {
    return this.currentState === 'ERROR';
  }

  public isDisposed(): boolean {
    return this.currentState === 'DISPOSED';
  }

  public canTransitionTo(nextState: ViewportState): boolean {
    if (this.currentState === nextState) return true;
    if (nextState === 'ERROR' || nextState === 'DISPOSED') return true;

    switch (this.currentState) {
      case 'WAITING':
        return nextState === 'MOUNTING';

      case 'MOUNTING':
        return nextState === 'ATTACHING' || nextState === 'WAITING';

      case 'ATTACHING':
        return nextState === 'ACTIVE' || nextState === 'DEGRADED';

      case 'ACTIVE':
        return nextState === 'DEGRADED' || nextState === 'WAITING' || nextState === 'MOUNTING';

      case 'DEGRADED':
        return nextState === 'ACTIVE' || nextState === 'WAITING' || nextState === 'MOUNTING';

      case 'ERROR':
        return nextState === 'WAITING' || nextState === 'MOUNTING';

      case 'DISPOSED':
        return nextState === 'WAITING';

      default:
        return false;
    }
  }

  public transitionTo(nextState: ViewportState): boolean {
    if (!this.canTransitionTo(nextState)) {
      return false;
    }
    this.currentState = nextState;
    return true;
  }

  public reset(): void {
    this.currentState = 'WAITING';
  }
}
