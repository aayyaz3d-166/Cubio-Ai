/**
 * CubiO — Step 85 Micro-Batch Scheduler
 * Manages micro-batch division and gradient accumulation steps across distributed ranks.
 */

export class BatchScheduler {
  private readonly microBatchSize: number;
  private readonly gradientAccumulationSteps: number;

  constructor(microBatchSize = 4, gradientAccumulationSteps = 2) {
    this.microBatchSize = microBatchSize;
    this.gradientAccumulationSteps = gradientAccumulationSteps;
  }

  public getEffectiveBatchSize(worldSize: number): number {
    return this.microBatchSize * this.gradientAccumulationSteps * worldSize;
  }

  public getAccumulationSteps(): number {
    return this.gradientAccumulationSteps;
  }
}
