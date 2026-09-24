/**
 * CUBiO AI — Task 191: Native Knowledge Consolidation
 * src/cubio/model/native_knowledge_consolidation/knowledgeMerger.ts
 *
 * Deterministic Knowledge Merger:
 * Non-destructively merges equivalent entities and facts, unioning
 * lineage and evidence, merging fragmented properties, and advancing OCC versions.
 */

import {
  ConsolidatedKnowledgeRecord,
  KnowledgeUnsafePromotionError,
} from './types';
import {
  KnowledgeEntity,
  KnowledgeFact,
  KnowledgeEpistemicStatus,
  EPISTEMIC_WEIGHTS,
} from '../native_knowledge_architecture/types';
import { KnowledgeHasher } from '../native_knowledge_architecture/knowledgeHasher';

export class KnowledgeMerger {
  /**
   * Merges equivalent entities into a single canonical consolidated record.
   */
  public static mergeEntities(entities: readonly KnowledgeEntity[]): ConsolidatedKnowledgeRecord {
    if (entities.length === 0) {
      throw new Error('[KnowledgeMerger] Cannot merge empty entity list.');
    }

    const primary = entities[0];
    const constituentIds = entities.map((e) => e.entityId);

    // 1. Merge fragmented properties non-destructively
    const mergedProperties: Record<string, unknown> = {};
    for (const ent of entities) {
      if (ent.properties) {
        for (const [k, v] of Object.entries(ent.properties)) {
          if (v !== undefined && v !== null) {
            mergedProperties[k] = v;
          }
        }
      }
    }

    // 2. Union lineage source IDs
    const lineageSourceSet = new Set<string>();
    for (const ent of entities) {
      lineageSourceSet.add(ent.entityId);
      if ((ent as any).lineageSourceIds && Array.isArray((ent as any).lineageSourceIds)) {
        for (const src of (ent as any).lineageSourceIds) {
          lineageSourceSet.add(src);
        }
      }
    }
    const lineageSourceIds = Array.from(lineageSourceSet).sort();

    // 3. Epistemic Hierarchy Determination (Highest Rank Retained)
    let highestRank: KnowledgeEpistemicStatus = primary.epistemicStatus;
    let hadAxiom = false;

    for (const ent of entities) {
      if (ent.epistemicStatus === 'AXIOM') hadAxiom = true;
      if (EPISTEMIC_WEIGHTS[ent.epistemicStatus] > EPISTEMIC_WEIGHTS[highestRank]) {
        highestRank = ent.epistemicStatus;
      }
    }

    // Anti-promotion guard: Cannot be promoted to AXIOM unless an input was already AXIOM
    if (highestRank === 'AXIOM' && !hadAxiom) {
      throw new KnowledgeUnsafePromotionError(
        primary.entityId,
        'AXIOM',
        'Consolidation cannot elevate ungrounded inputs to AXIOM without verified proof.'
      );
    }

    // 4. OCC Version Monotonicity (advance to maxVersion + 1)
    const maxVersion = Math.max(...entities.map((e) => e.stateVersion));
    const nextVersion = maxVersion + 1;

    // 5. Construct merged entity structure
    const mergedEntityData: Omit<KnowledgeEntity, 'checksum'> = {
      entityId: primary.entityId,
      name: primary.name,
      category: primary.category,
      address369: primary.address369,
      cellId343: primary.cellId343,
      tenantId: primary.tenantId,
      stateVersion: nextVersion,
      epistemicStatus: highestRank,
      properties: Object.freeze(mergedProperties),
      createdAt: Math.min(...entities.map((e) => e.createdAt)),
      updatedAt: 1000,
    };

    const checksum = KnowledgeHasher.computeEntityChecksum(mergedEntityData);

    return Object.freeze({
      canonicalId: primary.entityId,
      objectType: 'ENTITY',
      consolidatedData: Object.freeze({
        ...mergedEntityData,
        checksum,
      }),
      mergedCount: entities.length,
      constituentIds: Object.freeze(constituentIds.sort()),
      lineageSourceIds: Object.freeze(lineageSourceIds),
      evidenceIds: Object.freeze([]),
      finalEpistemicStatus: highestRank,
      stateVersion: nextVersion,
      checksum,
      tenantId: primary.tenantId,
      consolidatedAt: 1000,
    });
  }

  /**
   * Merges equivalent facts into a single canonical consolidated record.
   */
  public static mergeFacts(facts: readonly KnowledgeFact[]): ConsolidatedKnowledgeRecord {
    if (facts.length === 0) {
      throw new Error('[KnowledgeMerger] Cannot merge empty facts list.');
    }

    const primary = facts[0];
    const constituentIds = facts.map((f) => f.factId);

    // 1. Union all evidence and lineage IDs
    const evidenceIdSet = new Set<string>();
    const lineageSourceSet = new Set<string>();

    for (const fact of facts) {
      lineageSourceSet.add(fact.factId);
      for (const ev of fact.evidenceIds) {
        evidenceIdSet.add(ev);
      }
    }
    const evidenceIds = Array.from(evidenceIdSet).sort();
    const lineageSourceIds = Array.from(lineageSourceSet).sort();

    // 2. Probabilistic confidence accumulation (independent evidence)
    // C_combined = 1 - product(1 - C_i)
    let complementProduct = 1.0;
    for (const f of facts) {
      complementProduct *= 1.0 - Math.min(0.99, f.confidence);
    }
    const combinedConfidence = Math.round((1.0 - complementProduct) * 10000) / 10000;

    // 3. Epistemic Hierarchy
    let highestRank: KnowledgeEpistemicStatus = primary.epistemicStatus;
    for (const f of facts) {
      if (EPISTEMIC_WEIGHTS[f.epistemicStatus] > EPISTEMIC_WEIGHTS[highestRank]) {
        highestRank = f.epistemicStatus;
      }
    }

    // 4. OCC State Version Monotonicity
    const maxVersion = Math.max(...facts.map((f) => f.stateVersion));
    const nextVersion = maxVersion + 1;

    const mergedFactData: Omit<KnowledgeFact, 'checksum'> = {
      factId: primary.factId,
      subjectId: primary.subjectId,
      predicate: primary.predicate,
      objectId: primary.objectId,
      address369: primary.address369,
      cellId343: primary.cellId343,
      tenantId: primary.tenantId,
      stateVersion: nextVersion,
      epistemicStatus: highestRank,
      confidence: combinedConfidence,
      evidenceIds: Object.freeze(evidenceIds),
      createdAt: Math.min(...facts.map((f) => f.createdAt)),
      updatedAt: 1000,
    };

    const checksum = KnowledgeHasher.computeFactChecksum(mergedFactData);

    return Object.freeze({
      canonicalId: primary.factId,
      objectType: 'FACT',
      consolidatedData: Object.freeze({
        ...mergedFactData,
        checksum,
      }),
      mergedCount: facts.length,
      constituentIds: Object.freeze(constituentIds.sort()),
      lineageSourceIds: Object.freeze(lineageSourceIds),
      evidenceIds: Object.freeze(evidenceIds),
      finalEpistemicStatus: highestRank,
      stateVersion: nextVersion,
      checksum,
      tenantId: primary.tenantId,
      consolidatedAt: 1000,
    });
  }
}
