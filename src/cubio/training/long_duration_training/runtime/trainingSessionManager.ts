/**
 * CubiO — Universal Spatial Operating Environment
 * Step 80: Training Session Manager
 *
 * Manages long-duration session lifecycle:
 * - START, PAUSE, RESUME, STOP, CRASH_RECOVER
 * - Session ID generation and hash binding
 *
 * Classification: SOFTWARE_VALIDATED
 */

import { deterministicHash } from '../../../state/determinism';

export type SessionLifecycleState =
  | 'START'
  | 'RUNNING'
  | 'PAUSED'
  | 'RESUMED'
  | 'STOPPED'
  | 'CRASHED'
  | 'RECOVERED';

export class TrainingSessionManager {
  private sessionId: string;
  private state: SessionLifecycleState = 'START';
  private runId: string;
  private randomSeed: number;

  constructor(runId: string, seed = 369) {
    this.runId = runId;
    this.randomSeed = seed;
    const sHash = deterministicHash(`SESSION:${runId}:${seed}:${Date.now()}`);
    this.sessionId = `SESS_${sHash.slice(2, 10)}`;
  }

  public transitionTo(newState: SessionLifecycleState): void {
    this.state = newState;
  }

  public getSessionId(): string {
    return this.sessionId;
  }

  public getState(): SessionLifecycleState {
    return this.state;
  }

  public getSeed(): number {
    return this.randomSeed;
  }
}
