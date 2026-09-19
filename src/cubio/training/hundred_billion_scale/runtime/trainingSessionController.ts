/**
 * CubiO — Step 86 Training Session Controller
 */

export type SessionState = 'INITIALIZING' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'FAILED';

export class TrainingSessionController {
  private state: SessionState = 'INITIALIZING';
  private currentStep = 0;
  private readonly totalSteps: number;

  constructor(totalSteps = 60) {
    this.totalSteps = totalSteps;
  }

  public start(): void {
    this.state = 'RUNNING';
  }

  public stepForward(): void {
    this.currentStep += 1;
    if (this.currentStep >= this.totalSteps) {
      this.state = 'COMPLETED';
    }
  }

  public isComplete(): boolean {
    return this.state === 'COMPLETED';
  }

  public getState(): SessionState {
    return this.state;
  }
}
