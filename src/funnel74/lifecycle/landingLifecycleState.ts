/**
 * 3D Memory Studio — Funnel 74
 * Landing Lifecycle State Machine
 */

import { LandingLifecycleState } from '../types';

export class LandingLifecycleStateMachine {
  private currentState: LandingLifecycleState = 'UNMOUNTED';

  public getState(): LandingLifecycleState {
    return this.currentState;
  }

  public isActive(): boolean {
    return this.currentState === 'ACTIVE';
  }

  public isDisposed(): boolean {
    return this.currentState === 'DISPOSED';
  }

  public isFailed(): boolean {
    return this.currentState === 'FAILED';
  }

  public canTransitionTo(nextState: LandingLifecycleState): boolean {
    if (this.currentState === nextState) return true;

    if (nextState === 'FAILED') return true;

    switch (this.currentState) {
      case 'UNMOUNTED':
        return nextState === 'CREATED';

      case 'CREATED':
        return nextState === 'INITIALIZING' || nextState === 'DISPOSING';

      case 'INITIALIZING':
        return nextState === 'ACTIVE' || nextState === 'DISPOSING';

      case 'ACTIVE':
        return nextState === 'DISPOSING';

      case 'DISPOSING':
        return nextState === 'DISPOSED';

      case 'DISPOSED':
      case 'FAILED':
        // Once disposed or failed, a new lifecycle starts with CREATED
        return nextState === 'CREATED';

      default:
        return false;
    }
  }

  public transitionTo(nextState: LandingLifecycleState): boolean {
    if (!this.canTransitionTo(nextState)) {
      return false;
    }
    this.currentState = nextState;
    return true;
  }

  public reset(): void {
    this.currentState = 'UNMOUNTED';
  }
}
