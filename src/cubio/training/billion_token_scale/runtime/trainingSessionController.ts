/**
 * CubiO — Universal Spatial Operating Environment
 * Step 84: Training Session Controller
 *
 * Coordinates session states:
 * START, PAUSE, RESUME, CHECKPOINT, VALIDATE, CRASH_RECOVER, ABORT, FINALIZE
 *
 * Classification: SOFTWARE_VALIDATED
 */

export type BillionSessionState =
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
  private currentState: BillionSessionState = 'INITIALIZED';
  private runId: string;

  constructor(runId: string) {
    this.runId = runId;
  }

  public transition(state: BillionSessionState): void {
    this.currentState = state;
  }

  public getState(): BillionSessionState {
    return this.currentState;
  }

  public getRunId(): string {
    return this.runId;
  }
}
