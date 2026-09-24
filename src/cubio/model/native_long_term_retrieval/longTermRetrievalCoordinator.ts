/**
 * CUBiO AI — Task 176: Long-Term VDB Memory Retrieval
 * src/cubio/model/native_long_term_retrieval/longTermRetrievalCoordinator.ts
 *
 * Master Facade for Long-Term VDB Memory Retrieval:
 * Orchestrates inverted canonical reference indexing, selective bounded
 * context assembly, Primary VDB materialization, and safety governance.
 */

import {
  IS_ACTUATION_BLOCKED,
  ModelMemoryRecord,
  CanonicalMemoryReference,
} from '../native_memory_integration/types.js';
import { ModelMemoryCoordinator } from '../native_memory_integration/modelMemoryCoordinator.js';
import {
  LongTermRetrievalQuery,
  LongTermRetrievalResult,
  IndexStats,
  RetrievalBenchmarkReport,
} from './types.js';
import { LongTermReferenceIndex } from './longTermReferenceIndex.js';
import { SelectiveContextAssembler } from './selectiveContextAssembler.js';
import { LongTermRetrievalGovernor } from './longTermRetrievalGovernor.js';
import { LongTermRetrievalBenchmarker } from './longTermRetrievalBenchmarker.js';

export class LongTermRetrievalCoordinator {
  private readonly memoryCoord: ModelMemoryCoordinator;
  private readonly index: LongTermReferenceIndex;

  constructor(memoryCoord?: ModelMemoryCoordinator, index?: LongTermReferenceIndex) {
    LongTermRetrievalGovernor.assertActuationLockout();
    this.memoryCoord = memoryCoord ?? new ModelMemoryCoordinator();
    this.index = index ?? new LongTermReferenceIndex();
  }

  public getMemoryCoordinator(): ModelMemoryCoordinator {
    return this.memoryCoord;
  }

  public getIndex(): LongTermReferenceIndex {
    return this.index;
  }

  /**
   * Indexes a persistent VDB record into the lightweight long-term reference index.
   */
  public indexRecord(record: ModelMemoryRecord, callerTenantId: string): void {
    LongTermRetrievalGovernor.assertActuationLockout();
    this.index.indexReference(record.reference, callerTenantId);
  }

  /**
   * Batch indexes multiple records.
   */
  public indexRecords(records: readonly ModelMemoryRecord[], callerTenantId: string): void {
    LongTermRetrievalGovernor.assertActuationLockout();
    for (const rec of records) {
      this.index.indexReference(rec.reference, callerTenantId);
    }
  }

  /**
   * Selectively queries and assembles a bounded context stream from long-term memory.
   */
  public retrieve(querySpec: LongTermRetrievalQuery): LongTermRetrievalResult {
    LongTermRetrievalGovernor.assertActuationLockout(querySpec.query);
    if (querySpec.tokenBudget !== undefined) {
      LongTermRetrievalGovernor.assertTokenBudget(querySpec.tokenBudget);
    }

    return SelectiveContextAssembler.assembleContext({
      querySpec,
      index: this.index,
      memoryCoord: this.memoryCoord,
    });
  }

  /**
   * Runs an empirical benchmark evaluating latency, throughput, and determinism.
   */
  public benchmark(params: {
    tenantId: string;
    testQueries: readonly string[];
    iterations?: number;
  }): RetrievalBenchmarkReport {
    LongTermRetrievalGovernor.assertActuationLockout();
    return LongTermRetrievalBenchmarker.runBenchmark({
      tenantId: params.tenantId,
      index: this.index,
      memoryCoord: this.memoryCoord,
      testQueries: params.testQueries,
      iterations: params.iterations,
    });
  }

  /**
   * Returns memory statistics for a tenant.
   */
  public getStats(callerTenantId: string): IndexStats {
    return this.index.getStats(callerTenantId);
  }

  /**
   * Clears the index for a tenant or globally.
   */
  public clear(callerTenantId?: string): void {
    this.index.clear(callerTenantId);
  }
}
