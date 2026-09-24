/**
 * CUBiO AI — Task 189: Native Knowledge Indexing and Retrieval
 * src/cubio/model/native_knowledge_retrieval/knowledgeRetrievalCoordinator.ts
 *
 * Knowledge Retrieval Coordinator:
 * Master orchestration facade for multi-facet indexing, bounded selective retrieval,
 * multi-factor ranking, and on-demand materialization with integrity validation.
 */

import {
  TASK_189_ID,
  IS_ACTUATION_BLOCKED,
  KnowledgeIndexEntry,
  KnowledgeRetrievalQuery,
  KnowledgeRetrievalPageResult,
  MaterializedKnowledgePayload,
} from './types';
import { KnowledgeIndex } from './knowledgeIndex';
import { KnowledgeRetrievalEngine } from './knowledgeRetrievalEngine';
import { KnowledgeMaterializer } from './knowledgeMaterializer';
import { KnowledgeGovernor } from '../native_knowledge_architecture/knowledgeGovernor';
import { KnowledgeVdbStore } from '../native_knowledge_architecture/knowledgeVdbStore';
import {
  KnowledgeEntity,
  Concept,
  KnowledgeFact,
  Relationship,
  Evidence,
} from '../native_knowledge_architecture/types';

export class KnowledgeRetrievalCoordinator {
  public static readonly VERSION = '189.1.0';
  public static readonly IS_ACTUATION_BLOCKED = IS_ACTUATION_BLOCKED;

  private readonly index: KnowledgeIndex;
  private readonly engine: KnowledgeRetrievalEngine;

  constructor(index?: KnowledgeIndex) {
    this.index = index ?? new KnowledgeIndex();
    this.engine = new KnowledgeRetrievalEngine(this.index);
  }

  public getIndex(): KnowledgeIndex {
    return this.index;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Indexing Primitives
  // ───────────────────────────────────────────────────────────────────────────

  public indexEntity(entity: KnowledgeEntity): KnowledgeIndexEntry {
    return this.index.indexEntity(entity);
  }

  public indexConcept(concept: Concept): KnowledgeIndexEntry {
    return this.index.indexConcept(concept);
  }

  public indexFact(fact: KnowledgeFact): KnowledgeIndexEntry {
    return this.index.indexFact(fact);
  }

  public indexRelationship(rel: Relationship): KnowledgeIndexEntry {
    return this.index.indexRelationship(rel);
  }

  public indexEvidence(evidence: Evidence): KnowledgeIndexEntry {
    return this.index.indexEvidence(evidence);
  }

  public indexEntry(entry: KnowledgeIndexEntry): KnowledgeIndexEntry {
    return this.index.addEntry(entry);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Selective Retrieval & On-Demand Materialization
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Executes selective, reference-first retrieval with multi-factor ranking.
   */
  public query(query: KnowledgeRetrievalQuery): KnowledgeRetrievalPageResult {
    return this.engine.search(query);
  }

  /**
   * Materializes a single full payload on-demand from authoritative VDB.
   */
  public materialize(
    ref: KnowledgeIndexEntry,
    store: KnowledgeVdbStore,
    callerTenantId: string
  ): MaterializedKnowledgePayload {
    return KnowledgeMaterializer.materialize(ref, store, callerTenantId);
  }

  /**
   * Materializes a batch of references on-demand from authoritative VDB.
   */
  public materializeBatch(
    refs: readonly KnowledgeIndexEntry[],
    store: KnowledgeVdbStore,
    callerTenantId: string
  ): readonly MaterializedKnowledgePayload[] {
    return KnowledgeMaterializer.materializeBatch(refs, store, callerTenantId);
  }

  /**
   * Emits an advisory statement in sovereign read-only mode.
   */
  public emitAdvisory(message: string): {
    readonly taskId: string;
    readonly status: 'ADVISORY_EMITTED';
    readonly message: string;
    readonly actuationBlocked: boolean;
  } {
    KnowledgeGovernor.assertActuationBlocked(message);
    return Object.freeze({
      taskId: TASK_189_ID,
      status: 'ADVISORY_EMITTED',
      message,
      actuationBlocked: IS_ACTUATION_BLOCKED,
    });
  }
}
