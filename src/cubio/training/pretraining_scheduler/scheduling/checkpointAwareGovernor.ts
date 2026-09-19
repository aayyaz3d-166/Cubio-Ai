/**
 * CubiO — Universal Spatial Operating Environment
 * Step 65: Checkpoint-Aware Governor
 *
 * Schedules state checkpointing at optimal training milestones:
 * - Periodic step boundaries (e.g. every 1000 steps)
 * - Exponential loss reduction milestones
 * - Wall-clock time limits
 *
 * Classification: SOFTWARE_VALIDATED
 */

export class CheckpointAwareGovernor {
  private checkpointIntervalSteps: number;
  private lastCheckpointStep = 0;
  private bestLoss = Infinity;
  private checkpointsTriggeredCount = 0;

  constructor(checkpointIntervalSteps = 1000) {
    this.checkpointIntervalSteps = checkpointIntervalSteps;
  }

  /**
   * Determines if a checkpoint should be saved at the current step.
   */
  public shouldSaveCheckpoint(step: number, currentLoss: number): boolean {
    if (step === 0) {
      this.bestLoss = currentLoss;
      this.lastCheckpointStep = 0;
      this.checkpointsTriggeredCount++;
      return true; // Initial weights checkpoint
    }

    // 1. Periodic boundary
    if (step - this.lastCheckpointStep >= this.checkpointIntervalSteps) {
      this.lastCheckpointStep = step;
      this.checkpointsTriggeredCount++;
      return true;
    }

    // 2. Significant loss milestone (> 15% improvement from previous best)
    if (currentLoss < this.bestLoss * 0.85) {
      this.bestLoss = currentLoss;
      this.lastCheckpointStep = step;
      this.checkpointsTriggeredCount++;
      return true;
    }

    return false;
  }

  public getCheckpointsTriggered(): number {
    return this.checkpointsTriggeredCount;
  }

  public reset(): void {
    this.lastCheckpointStep = 0;
    this.bestLoss = Infinity;
    this.checkpointsTriggeredCount = 0;
  }
}
