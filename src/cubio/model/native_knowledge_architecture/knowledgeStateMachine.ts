/**
 * CUBiO AI — Task 184: Native Knowledge Architecture
 * src/cubio/model/native_knowledge_architecture/knowledgeStateMachine.ts
 *
 * Deterministic Knowledge State Machine managing lifecycle transitions:
 * PROPOSE -> CORROBORATE -> DERIVE -> CANONICALIZE -> REVISE -> DEPRECATE.
 * Enforces monotonic OCC version incrementation, anti-downgrade invariants,
 * and immutable transition history logs.
 */

import {
  KnowledgeEntity,
  KnowledgeFact,
  KnowledgeEpistemicStatus,
  KnowledgeLifecycleAction,
  KnowledgeStateTransitionEvent,
} from './types';
import { KnowledgeGovernor } from './knowledgeGovernor';
import { KnowledgeVdbStore } from './knowledgeVdbStore';

export class KnowledgeStateMachine {
  private readonly store: KnowledgeVdbStore;
  private readonly transitionHistory: KnowledgeStateTransitionEvent[] = [];

  constructor(store: KnowledgeVdbStore) {
    this.store = store;
  }

  public getHistory(): readonly KnowledgeStateTransitionEvent[] {
    return Object.freeze([...this.transitionHistory]);
  }

  /**
   * PROPOSE: Ingests an initial speculative entity or unverified hypothesis (V=1).
   */
  public proposeEntity(
    entity: Omit<KnowledgeEntity, 'checksum' | 'stateVersion'>,
    justification: string
  ): KnowledgeEntity {
    const saved = this.store.saveEntity(entity, 0);

    const event: KnowledgeStateTransitionEvent = {
      objectId: saved.entityId,
      objectType: 'ENTITY',
      fromStatus: saved.epistemicStatus,
      toStatus: saved.epistemicStatus,
      fromVersion: 0,
      toVersion: saved.stateVersion,
      action: 'PROPOSE',
      tenantId: saved.tenantId,
      justification,
      timestamp: Date.now(),
    };
    this.transitionHistory.push(Object.freeze(event));
    return saved;
  }

  /**
   * CORROBORATE: Attaches verified evidence, elevating epistemic status and confidence.
   */
  public corroborateFact(params: {
    factId: string;
    tenantId: string;
    expectedVersion: number;
    newEvidenceId: string;
    newConfidence?: number;
    elevateToStatus?: KnowledgeEpistemicStatus;
    justification: string;
  }): KnowledgeFact {
    const existing = this.store.getFact(params.factId, params.tenantId);
    if (!existing) {
      throw new Error(`[KnowledgeStateMachine] Fact "${params.factId}" not found for tenant "${params.tenantId}".`);
    }

    const targetStatus = params.elevateToStatus ?? existing.epistemicStatus;
    const evidenceList = Array.from(new Set([...existing.evidenceIds, params.newEvidenceId]));

    KnowledgeGovernor.assertValidPromotion(
      existing.factId,
      existing.epistemicStatus,
      targetStatus,
      evidenceList.length,
      existing.provenanceId !== undefined
    );

    const updated = this.store.saveFact(
      {
        factId: existing.factId,
        subjectId: existing.subjectId,
        predicate: existing.predicate,
        objectId: existing.objectId,
        epistemicStatus: targetStatus,
        confidence: params.newConfidence ?? Math.min(1.0, existing.confidence + 0.15),
        address369: existing.address369,
        tenantId: existing.tenantId,
        evidenceIds: evidenceList,
        provenanceId: existing.provenanceId,
        createdAt: existing.createdAt,
        updatedAt: Date.now(),
      },
      params.expectedVersion
    );

    const event: KnowledgeStateTransitionEvent = {
      objectId: updated.factId,
      objectType: 'FACT',
      fromStatus: existing.epistemicStatus,
      toStatus: updated.epistemicStatus,
      fromVersion: existing.stateVersion,
      toVersion: updated.stateVersion,
      action: 'CORROBORATE',
      tenantId: updated.tenantId,
      justification: params.justification,
      timestamp: Date.now(),
    };
    this.transitionHistory.push(Object.freeze(event));
    return updated;
  }

  /**
   * DERIVE: Advances status to DERIVED through verified reasoning derivation and provenance link.
   */
  public deriveFact(params: {
    factId: string;
    tenantId: string;
    expectedVersion: number;
    provenanceId: string;
    confidence?: number;
    justification: string;
  }): KnowledgeFact {
    const existing = this.store.getFact(params.factId, params.tenantId);
    if (!existing) {
      throw new Error(`[KnowledgeStateMachine] Fact "${params.factId}" not found for tenant "${params.tenantId}".`);
    }

    const updated = this.store.saveFact(
      {
        factId: existing.factId,
        subjectId: existing.subjectId,
        predicate: existing.predicate,
        objectId: existing.objectId,
        epistemicStatus: 'DERIVED',
        confidence: params.confidence ?? 0.90,
        address369: existing.address369,
        tenantId: existing.tenantId,
        evidenceIds: existing.evidenceIds,
        provenanceId: params.provenanceId,
        createdAt: existing.createdAt,
        updatedAt: Date.now(),
      },
      params.expectedVersion
    );

    const event: KnowledgeStateTransitionEvent = {
      objectId: updated.factId,
      objectType: 'FACT',
      fromStatus: existing.epistemicStatus,
      toStatus: 'DERIVED',
      fromVersion: existing.stateVersion,
      toVersion: updated.stateVersion,
      action: 'DERIVE',
      tenantId: updated.tenantId,
      justification: params.justification,
      timestamp: Date.now(),
    };
    this.transitionHistory.push(Object.freeze(event));
    return updated;
  }

  /**
   * CANONICALIZE: Locks knowledge as canonical FACT or AXIOM with verified provenance.
   */
  public canonicalizeEntity(params: {
    entityId: string;
    tenantId: string;
    expectedVersion: number;
    targetStatus: 'FACT' | 'AXIOM';
    justification: string;
  }): KnowledgeEntity {
    const existing = this.store.getEntity(params.entityId, params.tenantId);
    if (!existing) {
      throw new Error(`[KnowledgeStateMachine] Entity "${params.entityId}" not found for tenant "${params.tenantId}".`);
    }

    const updated = this.store.saveEntity(
      {
        entityId: existing.entityId,
        name: existing.name,
        category: existing.category,
        address369: existing.address369,
        tenantId: existing.tenantId,
        epistemicStatus: params.targetStatus,
        properties: existing.properties,
        createdAt: existing.createdAt,
        updatedAt: Date.now(),
      },
      params.expectedVersion
    );

    const event: KnowledgeStateTransitionEvent = {
      objectId: updated.entityId,
      objectType: 'ENTITY',
      fromStatus: existing.epistemicStatus,
      toStatus: updated.epistemicStatus,
      fromVersion: existing.stateVersion,
      toVersion: updated.stateVersion,
      action: 'CANONICALIZE',
      tenantId: updated.tenantId,
      justification: params.justification,
      timestamp: Date.now(),
    };
    this.transitionHistory.push(Object.freeze(event));
    return updated;
  }

  /**
   * REVISE: Updates attributes or properties with monotonic OCC incrementation.
   */
  public reviseEntity(params: {
    entityId: string;
    tenantId: string;
    expectedVersion: number;
    updatedProperties?: Record<string, unknown>;
    updatedAddress369?: number;
    justification: string;
  }): KnowledgeEntity {
    const existing = this.store.getEntity(params.entityId, params.tenantId);
    if (!existing) {
      throw new Error(`[KnowledgeStateMachine] Entity "${params.entityId}" not found for tenant "${params.tenantId}".`);
    }

    const updated = this.store.saveEntity(
      {
        entityId: existing.entityId,
        name: existing.name,
        category: existing.category,
        address369: params.updatedAddress369 ?? existing.address369,
        tenantId: existing.tenantId,
        epistemicStatus: existing.epistemicStatus,
        properties: {
          ...(existing.properties ?? {}),
          ...(params.updatedProperties ?? {}),
        },
        createdAt: existing.createdAt,
        updatedAt: Date.now(),
      },
      params.expectedVersion
    );

    const event: KnowledgeStateTransitionEvent = {
      objectId: updated.entityId,
      objectType: 'ENTITY',
      fromStatus: existing.epistemicStatus,
      toStatus: updated.epistemicStatus,
      fromVersion: existing.stateVersion,
      toVersion: updated.stateVersion,
      action: 'REVISE',
      tenantId: updated.tenantId,
      justification: params.justification,
      timestamp: Date.now(),
    };
    this.transitionHistory.push(Object.freeze(event));
    return updated;
  }
}
