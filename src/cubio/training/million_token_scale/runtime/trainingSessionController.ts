/**
 * CubiO — Universal Spatial Operating Environment
 * Step 81: Training Session Controller
 *
 * Coordinates long session state transitions:
 * - START, PAUSE, RESUME, CHECKPOINT, CRASH_RECOVER, FINALIZE
 *
 * Classification: SOFTWARE_VALIDATED
 */

export type SessionState =
  | 'INITIALIZED'
  | 'RUNNING'
  | 'PAUSED'
  | 'RESUMED'
  | 'CHECKPOINTED'
  | 'RECOVERED'
  | 'FINALIZED';

export class TrainingSessionController {
  private currentState: SessionState = 'INITIALIZED';
  private runId: string;

  constructor(runId: string) {
    this.runId = runId;
  }

  public transition(state: SessionState): void {
    this.currentState = state;
  }

  public getState(): SessionState {
    return this.currentState;
  }

  public getRunId(): string {
    return this.runId;
  }
}
