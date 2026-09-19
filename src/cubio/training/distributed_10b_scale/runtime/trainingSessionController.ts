/**
 * CubiO — Step 85 Training Session Controller
 * Manages distributed training session state transitions and stop criteria.
 */

export type TrainingSessionStatus = 'INITIALIZING' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'FAILED';

export class TrainingSessionController {
  private status: TrainingSessionStatus = 'INITIALIZING';
  private currentStep = 0;
  private readonly totalSteps: number;

  constructor(totalSteps = 60) {
    this.totalSteps = totalSteps;
  }

  public start(): void {
    this.status = 'RUNNING';
  }

  public stepForward(): void {
    this.currentStep += 1;
    if (this.currentStep >= this.totalSteps) {
      this.status = 'COMPLETED';
    }
  }

  public getStatus(): TrainingSessionStatus {
    return this.status;
  }

  public getCurrentStep(): number {
    return this.currentStep;
  }

  public isComplete(): boolean {
    return this.status === 'COMPLETED';
  }
}
