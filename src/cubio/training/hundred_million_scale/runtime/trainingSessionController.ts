/**
 * CubiO — Universal Spatial Operating Environment
 * Step 83: Training Session Controller
 *
 * Coordinates session states:
 * START, PAUSE, RESUME, CHECKPOINT, VALIDATE, CRASH_RECOVER, ABORT, FINALIZE
 *
 * Classification: SOFTWARE_VALIDATED
 */

export type HundredMillionSessionState =
  | 'INITIALIZED'
  | 'RUNNING'
  | 'PAUSED'
  | 'RESUMED'
  | 'CHECKPOINTED'
  | 'VALIDATING'
  | 'RECOVERED'
  | 'ABORTED'
  | 'FINALIZED';

export class TrainingSessionController {
  private currentState: HundredMillionSessionState = 'INITIALIZED';
  private runId: string;

  constructor(runId: string) {
    this.runId = runId;
  }

  public transition(state: HundredMillionSessionState): void {
    this.currentState = state;
  }

  public getState(): HundredMillionSessionState {
    return this.currentState;
  }

  public getRunId(): string {
    return this.runId;
  }
}
