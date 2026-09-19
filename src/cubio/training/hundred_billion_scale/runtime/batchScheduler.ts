/**
 * CubiO — Step 86 Micro-Batch Scheduler
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
}
