/**
 * CUBiO AI — Task 179: Long-Context Reasoning Integration
 * src/cubio/model/native_long_context_reasoning/longContextReasoningCoordinator.ts
 *
 * Master coordinator orchestrating long-context retrieval, epistemic filtering,
 * and deductive reasoning integration with certified Phase 10 engine.
 *
 * STRICT INVARIANTS:
 * 1. Feeds reasoning only verified, relevant, and provenance-backed context.
 * 2. Multi-window reasoning without treating summaries as canonical facts.
 * 3. Preserves epistemic levels, contradiction handling, OCC, and tenant isolation.
 * 4. Bounded reasoning depth, retrieved context, and memory consumption.
 * 5. Permanent hardware actuation lockout: IS_ACTUATION_BLOCKED === true.
 */

import { ModelMemoryCoordinator } from '../native_memory_integration/modelMemoryCoordinator.js';
import { ModelMemoryRecord } from '../native_memory_integration/types.js';
import { ContextEpistemicFilter } from './contextEpistemicFilter.js';
import { LongContextReasoningEngine } from './longContextReasoningEngine.js';
import { LongContextReasoningGovernor } from './longContextReasoningGovernor.js';
import {
  EpistemicStatus,
  IS_ACTUATION_BLOCKED,
  LongContextReasoningQuery,
  LongContextReasoningResult,
  TASK_179_ID,
  VerifiedReasoningContextItem,
} from './types.js';

export class LongContextReasoningCoordinator {
  public readonly taskId: string = TASK_179_ID;
  public readonly isActuationBlocked: boolean = IS_ACTUATION_BLOCKED;

  private readonly engine: LongContextReasoningEngine;
  private readonly filter: ContextEpistemicFilter;
  private readonly governor: LongContextReasoningGovernor;
  private readonly memoryCoord: ModelMemoryCoordinator;

  constructor(memoryCoord?: ModelMemoryCoordinator) {
    this.memoryCoord = memoryCoord ?? new ModelMemoryCoordinator();
    this.governor = new LongContextReasoningGovernor();
    this.filter = new ContextEpistemicFilter();
    this.engine = new LongContextReasoningEngine(this.filter, this.governor);
  }

  public getEngine(): LongContextReasoningEngine {
    return this.engine;
  }

  public getGovernor(): LongContextReasoningGovernor {
    return this.governor;
  }

  public getFilter(): ContextEpistemicFilter {
    return this.filter;
  }

  public getMemoryCoordinator(): ModelMemoryCoordinator {
    return this.memoryCoord;
  }

  /**
   * Helper to convert an authoritative Primary VDB ModelMemoryRecord into a verified context item.
   */
  public itemFromRecord(
    record: ModelMemoryRecord,
    isSummary: boolean = false,
    sourceContextId: string = 'vdb_primary'
  ): VerifiedReasoningContextItem {
    return Object.freeze({
      objectId: record.reference.objectId,
      content: record.content,
      epistemicStatus: (record.epistemicStatus as EpistemicStatus) || 'FACT',
      sourceContextId,
      stateVersion: record.reference.stateVersion,
      checksum: record.reference.checksum,
      tenantId: record.reference.tenantId,
      isSummary,
      confidence: record.epistemicStatus === 'AXIOM' ? 1.0 : 0.9,
      tokenCount: Math.ceil(record.content.length / 4),
      spatialCellId: record.reference.spatialCellId,
    });
  }

  /**
   * Execute deterministic multi-window long-context reasoning.
   */
  public reason(query: LongContextReasoningQuery): LongContextReasoningResult {
    return this.engine.reason(query);
  }
}
