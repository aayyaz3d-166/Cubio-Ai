/**
 * CubiO — Step 89 Priority Batch Queue
 */

import { DistributedBatchRequest } from '../types';

export class BatchQueue {
  private readonly queue: DistributedBatchRequest[] = [];

  public enqueue(req: DistributedBatchRequest): void {
    this.queue.push(req);
  }

  public dequeueBatch(maxBatchSize = 64): DistributedBatchRequest[] {
    return this.queue.splice(0, maxBatchSize);
  }

  public get pendingCount(): number {
    return this.queue.length;
  }
}
