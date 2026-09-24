/**
 * CUBiO AI — Task 180: Long-Context Memory Consolidation
 * src/cubio/model/native_long_context_consolidation/consolidationCoordinator.ts
 *
 * Master coordinator managing bounded consolidation queues, Primary VDB integration,
 * batch consolidation processing, and deterministic rollback.
 *
 * STRICT INVARIANTS:
 * 1. Primary VDB remains canonical authority; never silently altered.
 * 2. Bounded consolidation queue (<= 500) and batch sizes (<= 100).
 * 3. Exact rollback mechanics for audit and tamper recovery.
 * 4. Permanent hardware actuation lockout: IS_ACTUATION_BLOCKED === true.
 */

import { ModelMemoryCoordinator } from '../native_memory_integration/modelMemoryCoordinator.js';
import { ConsolidationDetector } from './consolidationDetector.js';
import { ConsolidationGovernor } from './consolidationGovernor.js';
import { LongContextConsolidator } from './longContextConsolidator.js';
import {
  ConsolidationBatch,
  ConsolidationCandidate,
  ConsolidationResult,
  IS_ACTUATION_BLOCKED,
  MAX_CONSOLIDATION_BATCH_SIZE,
  MAX_CONSOLIDATION_QUEUE_SIZE,
  TASK_180_ID,
} from './types.js';

export class ConsolidationCoordinator {
  public readonly taskId: string = TASK_180_ID;
  public readonly isActuationBlocked: boolean = IS_ACTUATION_BLOCKED;

  private readonly consolidator: LongContextConsolidator;
  private readonly governor: ConsolidationGovernor;
  private readonly detector: ConsolidationDetector;
  private readonly memoryCoord: ModelMemoryCoordinator;

  // Bounded consolidation queue
  private readonly queue: ConsolidationCandidate[] = [];

  constructor(memoryCoord?: ModelMemoryCoordinator) {
    this.memoryCoord = memoryCoord ?? new ModelMemoryCoordinator();
    this.governor = new ConsolidationGovernor();
    this.detector = new ConsolidationDetector();
    this.consolidator = new LongContextConsolidator(this.memoryCoord, this.governor, this.detector);
  }

  public getConsolidator(): LongContextConsolidator {
    return this.consolidator;
  }

  public getGovernor(): ConsolidationGovernor {
    return this.governor;
  }

  public getDetector(): ConsolidationDetector {
    return this.detector;
  }

  public getMemoryCoordinator(): ModelMemoryCoordinator {
    return this.memoryCoord;
  }

  public getQueueSize(): number {
    return this.queue.length;
  }

  /**
   * Enqueue a consolidation candidate into the bounded queue.
   */
  public enqueueCandidate(candidate: ConsolidationCandidate): void {
    this.governor.assertActuationBlocked(candidate.content);
    this.governor.assertQueueBounds(this.queue.length);
    this.queue.push(Object.freeze({ ...candidate }));
  }

  /**
   * Drain and consolidate queued candidates belonging to a specific tenant in bounded batches.
   */
  public processQueue(batchId: string, tenantId: string): ConsolidationResult {
    this.governor.assertActuationBlocked();

    // Extract up to MAX_CONSOLIDATION_BATCH_SIZE candidates for this tenant
    const matchingIndices: number[] = [];
    const batchCandidates: ConsolidationCandidate[] = [];

    for (let i = 0; i < this.queue.length && batchCandidates.length < MAX_CONSOLIDATION_BATCH_SIZE; i++) {
      if (this.queue[i].tenantId === tenantId) {
        matchingIndices.push(i);
        batchCandidates.push(this.queue[i]);
      }
    }

    // Remove extracted items from queue in reverse order
    for (let i = matchingIndices.length - 1; i >= 0; i--) {
      this.queue.splice(matchingIndices[i], 1);
    }

    const batch: ConsolidationBatch = Object.freeze({
      batchId,
      tenantId,
      candidates: Object.freeze(batchCandidates),
    });

    return this.consolidator.consolidateBatch(batch);
  }

  /**
   * Execute an explicit batch consolidation directly.
   */
  public consolidateBatch(batch: ConsolidationBatch): ConsolidationResult {
    return this.consolidator.consolidateBatch(batch);
  }

  /**
   * Revert a consolidation state.
   */
  public rollback(consolidationId: string, tenantId: string): void {
    this.consolidator.rollback(consolidationId, tenantId);
  }

  /**
   * Clear in-memory queue.
   */
  public clearQueue(): void {
    this.queue.length = 0;
  }
}
