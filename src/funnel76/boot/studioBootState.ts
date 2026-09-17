/**
 * 3D Memory Studio — Funnel 76
 * Studio Boot State Machine
 */

import { StudioBootState } from '../types';

export const ORDERED_BOOT_STATES: readonly StudioBootState[] = Object.freeze([
  'IDLE',
  'BOOT_REQUESTED',
  'BOOTSTRAPPING',
  'CHECKING_RENDERER',
  'CHECKING_CAMERA',
  'CHECKING_SCENE',
  'CHECKING_LANDING',
  'CHECKING_WORKSPACE',
  'CHECKING_RUNTIME',
  'CHECKING_DATA',
  'READY',
  'ACTIVE',
]);

export class StudioBootStateMachine {
  private currentState: StudioBootState = 'IDLE';

  public getState(): StudioBootState {
    return this.currentState;
  }

  public isReady(): boolean {
    return this.currentState === 'READY' || this.currentState === 'ACTIVE';
  }

  public isActive(): boolean {
    return this.currentState === 'ACTIVE';
  }

  public isFailed(): boolean {
    return this.currentState === 'FAILED';
  }

  public isDisposed(): boolean {
    return this.currentState === 'DISPOSED';
  }

  public canTransitionTo(nextState: StudioBootState): boolean {
    if (this.currentState === nextState) return true;

    if (nextState === 'FAILED') return true;
    if (nextState === 'DISPOSED') return true;

    switch (this.currentState) {
      case 'IDLE':
        return nextState === 'BOOT_REQUESTED';

      case 'BOOT_REQUESTED':
        return nextState === 'BOOTSTRAPPING';

      case 'BOOTSTRAPPING':
        return nextState === 'CHECKING_RENDERER';

      case 'CHECKING_RENDERER':
        return nextState === 'CHECKING_CAMERA';

      case 'CHECKING_CAMERA':
        return nextState === 'CHECKING_SCENE';

      case 'CHECKING_SCENE':
        return nextState === 'CHECKING_LANDING';

      case 'CHECKING_LANDING':
        return nextState === 'CHECKING_WORKSPACE';

      case 'CHECKING_WORKSPACE':
        return nextState === 'CHECKING_RUNTIME';

      case 'CHECKING_RUNTIME':
        return nextState === 'CHECKING_DATA';

      case 'CHECKING_DATA':
        return nextState === 'READY';

      case 'READY':
        return nextState === 'ACTIVE' || nextState === 'RETRYING' || nextState === 'BOOT_REQUESTED';

      case 'ACTIVE':
        return nextState === 'RETRYING' || nextState === 'BOOT_REQUESTED';

      case 'FAILED':
        return nextState === 'RETRYING' || nextState === 'BOOT_REQUESTED';

      case 'RETRYING':
        return nextState === 'BOOT_REQUESTED' || nextState === 'BOOTSTRAPPING';

      case 'DISPOSED':
        return nextState === 'BOOT_REQUESTED' || nextState === 'IDLE';

      default:
        return false;
    }
  }

  public transitionTo(nextState: StudioBootState): boolean {
    if (!this.canTransitionTo(nextState)) {
      return false;
    }
    this.currentState = nextState;
    return true;
  }

  public reset(): void {
    this.currentState = 'IDLE';
  }
}
