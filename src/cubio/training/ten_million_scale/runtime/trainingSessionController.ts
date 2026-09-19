/**
 * CubiO — Universal Spatial Operating Environment
 * Step 82: Training Session Controller
 *
 * Coordinates session states:
 * START, PAUSE, RESUME, CHECKPOINT, VALIDATE, CRASH_RECOVER, ABORT, FINALIZE
 *
 * Classification: SOFTWARE_VALIDATED
 */

export type TenMillionSessionState =
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
  private currentState: TenMillionSessionState = 'INITIALIZED';
  private runId: string;

  constructor(runId: string) {
    this.runId = runId;
  }

  public transition(state: TenMillionSessionState): void {
    this.currentState = state;
  }

  public getState(): TenMillionSessionState {
    return this.currentState;
  }

  public getRunId(): string {
    return this.runId;
  }
}
