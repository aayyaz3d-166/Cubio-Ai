/**
 * CubiO — Universal Spatial Operating Environment
 * Step 68: Sequence Slot Manager
 *
 * Tracks and schedules concurrent sequence slots for continuous batching:
 * - Dynamic slot insertion upon request arrival
 * - Immediate slot eviction upon generation completion
 *
 * Classification: SOFTWARE_VALIDATED
 */

import { ActiveGenerationSlot, InferenceRequest } from '../types';
import { PagedKVCacheManager } from '../kv_cache/pagedKVCacheManager';

export class SequenceSlotManager {
  private activeSlots: Map<string, ActiveGenerationSlot> = new Map();
  private maxSlots: number;
  private pagedKV: PagedKVCacheManager;

  constructor(maxSlots = 16, pagedKV?: PagedKVCacheManager) {
    this.maxSlots = maxSlots;
    this.pagedKV = pagedKV ?? new PagedKVCacheManager();
  }

  /**
   * Admits a new request into an active generation slot.
   */
  public admitRequest(req: InferenceRequest): ActiveGenerationSlot {
    if (this.activeSlots.size >= this.maxSlots) {
      throw new Error(`Max concurrent inference slots (${this.maxSlots}) reached.`);
    }

    const blockTable = this.pagedKV.allocateSequence(req.requestId, req.promptTokens.length);

    const slot: ActiveGenerationSlot = {
      requestId: req.requestId,
      promptTokensCount: req.promptTokens.length,
      generatedTokensCount: 0,
      maxNewTokens: req.maxNewTokens,
      isFinished: false,
      blockTable,
    };

    this.activeSlots.set(req.requestId, slot);
    return slot;
  }

  /**
   * Advances a generation step on an active slot.
   */
  public advanceSlot(requestId: string, maxTokens: number): boolean {
    const slot = this.activeSlots.get(requestId);
    if (!slot || slot.isFinished) return false;

    (slot as any).generatedTokensCount++;
    this.pagedKV.appendTokens(requestId, 1);

    if (slot.generatedTokensCount >= maxTokens) {
      (slot as any).isFinished = true;
      return true; // finished
    }

    return false;
  }

  /**
   * Evicts a finished request and recycles KV memory.
   */
  public evictFinishedRequest(requestId: string): void {
    this.pagedKV.freeSequence(requestId);
    this.activeSlots.delete(requestId);
  }

  public getActiveSlots(): readonly ActiveGenerationSlot[] {
    return Object.freeze(Array.from(this.activeSlots.values()));
  }

  public getActiveSlotCount(): number {
    return this.activeSlots.size;
  }

  public getPagedKV(): PagedKVCacheManager {
    return this.pagedKV;
  }

  public reset(): void {
    this.activeSlots.clear();
    this.pagedKV.reset();
  }
}
