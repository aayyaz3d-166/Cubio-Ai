/**
 * CubiO — Universal Spatial Operating Environment
 * Step 68: Continuous Batching Scheduler
 *
 * Implements iteration-level dynamic batching:
 * Admitting new requests immediately into running forward passes without waiting
 * for entire batches to finish, eliminating padding latency.
 *
 * Classification: SOFTWARE_VALIDATED
 */

import { InferenceRequest } from '../types';
import { SequenceSlotManager } from './sequenceSlotManager';

export class ContinuousBatchingScheduler {
  private slotManager: SequenceSlotManager;
  private pendingQueue: InferenceRequest[] = [];
  private totalCompleted = 0;

  constructor(slotManager?: SequenceSlotManager) {
    this.slotManager = slotManager ?? new SequenceSlotManager();
  }

  /**
   * Enqueues an incoming inference request.
   */
  public enqueueRequest(req: InferenceRequest): void {
    this.pendingQueue.push(req);
  }

  /**
   * Executes one iteration-level generation step across all active slots.
   */
  public stepIteration(): { activeTokensGenerated: number; completedRequestIds: string[] } {
    // 1. Admit from pending queue if slots available
    while (this.pendingQueue.length > 0 && this.slotManager.getActiveSlotCount() < 16) {
      const nextReq = this.pendingQueue.shift()!;
      this.slotManager.admitRequest(nextReq);
    }

    // 2. Advance all active slots by 1 token
    const completedIds: string[] = [];
    const active = this.slotManager.getActiveSlots();

    for (const slot of active) {
      if (!slot.isFinished) {
        const isDone = this.slotManager.advanceSlot(slot.requestId, slot.maxNewTokens);
        if (isDone) {
          completedIds.push(slot.requestId);
          this.totalCompleted++;
        }
      }
    }

    // 3. Clean up completed slots
    for (const id of completedIds) {
      this.slotManager.evictFinishedRequest(id);
    }

    return {
      activeTokensGenerated: active.length,
      completedRequestIds: completedIds,
    };
  }

  public getPendingQueueLength(): number {
    return this.pendingQueue.length;
  }

  public getTotalCompleted(): number {
    return this.totalCompleted;
  }

  public getSlotManager(): SequenceSlotManager {
    return this.slotManager;
  }

  public reset(): void {
    this.pendingQueue.length = 0;
    this.totalCompleted = 0;
    this.slotManager.reset();
  }
}
