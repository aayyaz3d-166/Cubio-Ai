/**
 * CUBiO AI — Task 191: Native Knowledge Consolidation
 * src/cubio/model/native_knowledge_consolidation/knowledgeConsolidationCoordinator.ts
 *
 * Knowledge Consolidation Coordinator:
 * Master orchestration facade for detecting duplicates, fragments, and
 * contradictions, executing deterministic merges, and reporting consolidation metrics.
 */

import {
  TASK_191_ID,
  IS_ACTUATION_BLOCKED,
  ConsolidatedKnowledgeRecord,
  ConsolidationReport,
} from './types';
import { KnowledgeConsolidator } from './knowledgeConsolidator';
import { KnowledgeGovernor } from '../native_knowledge_architecture/knowledgeGovernor';
import { KnowledgeVdbStore } from '../native_knowledge_architecture/knowledgeVdbStore';
import {
  KnowledgeEntity,
  KnowledgeFact,
} from '../native_knowledge_architecture/types';

export class KnowledgeConsolidationCoordinator {
  public static readonly VERSION = '191.1.0';
  public static readonly IS_ACTUATION_BLOCKED = IS_ACTUATION_BLOCKED;

  /**
   * Consolidates a collection of KnowledgeEntity records.
   */
  public consolidateEntities(
    entities: readonly KnowledgeEntity[],
    callerTenantId: string,
    strict: boolean = true
  ): {
    readonly records: readonly ConsolidatedKnowledgeRecord[];
    readonly report: ConsolidationReport;
  } {
    KnowledgeGovernor.assertActuationBlocked(callerTenantId);
    return KnowledgeConsolidator.consolidateEntities(entities, callerTenantId, strict);
  }

  /**
   * Consolidates a collection of KnowledgeFact records.
   */
  public consolidateFacts(
    facts: readonly KnowledgeFact[],
    callerTenantId: string,
    strict: boolean = true
  ): {
    readonly records: readonly ConsolidatedKnowledgeRecord[];
    readonly report: ConsolidationReport;
  } {
    KnowledgeGovernor.assertActuationBlocked(callerTenantId);
    return KnowledgeConsolidator.consolidateFacts(facts, callerTenantId, strict);
  }

  /**
   * Emits an advisory statement under sovereign read-only constraints.
   */
  public emitAdvisory(message: string): {
    readonly taskId: string;
    readonly status: 'ADVISORY_EMITTED';
    readonly message: string;
    readonly actuationBlocked: boolean;
  } {
    KnowledgeGovernor.assertActuationBlocked(message);
    return Object.freeze({
      taskId: TASK_191_ID,
      status: 'ADVISORY_EMITTED',
      message,
      actuationBlocked: IS_ACTUATION_BLOCKED,
    });
  }
}
