/**
 * CubiO — Step 89 Continuous Batcher
 * Enables iteration-level dynamic request insertion, execution, and eviction.
 */

import { BatchQueue } from './batchQueue';
import { DistributedBatchRequest } from '../types';

export class ContinuousBatcher {
  private readonly queue: BatchQueue = new BatchQueue();
  private activeBatch: DistributedBatchRequest[] = [];
  public static readonly MAX_ACTIVE_BATCH_SIZE = 128;

  public submitRequest(request: DistributedBatchRequest): void {
    this.queue.enqueue(request);
  }

  public stepIteration(): {
    processedCount: number;
    completedCount: number;
    activeBatchSize: number;
  } {
    // 1. Fill empty slots from queue
    const availableSlots = ContinuousBatcher.MAX_ACTIVE_BATCH_SIZE - this.activeBatch.length;
    if (availableSlots > 0 && this.queue.pendingCount > 0) {
      const newArrivals = this.queue.dequeueBatch(availableSlots);
      this.activeBatch.push(...newArrivals);
    }

    // 2. Step each active request
    let completed = 0;
    for (const req of this.activeBatch) {
      req.generatedTokens.push(Math.floor(Math.random() * 32000));
      if (req.generatedTokens.length >= (req.config?.maxNewTokens || 8)) {
        req.isCompleted = true;
        completed++;
      }
    }

    // 3. Remove completed requests
    const processed = this.activeBatch.length;
    this.activeBatch = this.activeBatch.filter((r) => !r.isCompleted);

    return {
      processedCount: processed,
      completedCount: completed,
      activeBatchSize: this.activeBatch.length,
    };
  }

  public get activeRequestsCount(): number {
    return this.activeBatch.length;
  }

  public get pendingQueueCount(): number {
    return this.queue.pendingCount;
  }
}
