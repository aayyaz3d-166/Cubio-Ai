/**
 * CUBiO AI — Task 191: Native Knowledge Consolidation
 * src/cubio/model/native_knowledge_consolidation/knowledgeConsolidator.ts
 *
 * Core Knowledge Consolidator Engine:
 * Partitions candidate entities and facts, performs pre-consolidation contradiction
 * detection, and executes deterministic non-destructive merges.
 */

import * as crypto from 'crypto';
import {
  ConsolidatedKnowledgeRecord,
  ConsolidationReport,
  KnowledgeConsolidationTenantViolationError,
} from './types';
import { ContradictionDetector } from './contradictionDetector';
import { KnowledgeMerger } from './knowledgeMerger';
import {
  KnowledgeEntity,
  KnowledgeFact,
} from '../native_knowledge_architecture/types';
import { KnowledgeGovernor } from '../native_knowledge_architecture/knowledgeGovernor';
import { EntityNormalizer } from '../native_knowledge_normalization/entityNormalizer';

export class KnowledgeConsolidator {
  /**
   * Consolidates a collection of KnowledgeEntity records.
   */
  public static consolidateEntities(
    entities: readonly KnowledgeEntity[],
    callerTenantId: string,
    strict: boolean = true
  ): {
    readonly records: readonly ConsolidatedKnowledgeRecord[];
    readonly report: ConsolidationReport;
  } {
    // 1. Verify tenant integrity
    for (const ent of entities) {
      KnowledgeGovernor.assertActuationBlocked(ent.name);
      if (ent.tenantId !== callerTenantId) {
        throw new KnowledgeConsolidationTenantViolationError(callerTenantId, ent.tenantId);
      }
    }

    // 2. Partition by canonical identity key
    const groups = new Map<string, KnowledgeEntity[]>();
    for (const ent of entities) {
      const canonKey = EntityNormalizer.deriveCanonicalEntityId(
        ent.tenantId,
        ent.category,
        ent.name
      );
      if (!groups.has(canonKey)) groups.set(canonKey, []);
      groups.get(canonKey)!.push(ent);
    }

    const consolidatedRecords: ConsolidatedKnowledgeRecord[] = [];
    let duplicatesMerged = 0;
    let fragmentsMerged = 0;
    let contradictionsDetected = 0;
    let unmergedCount = 0;

    for (const group of groups.values()) {
      if (group.length === 1) {
        // Single entity: convert to 1:1 consolidated record
        const single = group[0];
        consolidatedRecords.push({
          canonicalId: single.entityId,
          objectType: 'ENTITY',
          consolidatedData: Object.freeze({ ...single }),
          mergedCount: 1,
          constituentIds: Object.freeze([single.entityId]),
          lineageSourceIds: Object.freeze([single.entityId]),
          evidenceIds: Object.freeze([]),
          finalEpistemicStatus: single.epistemicStatus,
          stateVersion: single.stateVersion,
          checksum: single.checksum,
          tenantId: single.tenantId,
          consolidatedAt: 1000,
        });
        continue;
      }

      // Pre-consolidation contradiction check
      const contradictionCheck = ContradictionDetector.detectEntityContradictions(group, strict);
      if (contradictionCheck.hasContradiction) {
        contradictionsDetected++;
        unmergedCount += group.length;
        continue;
      }

      // Check if this was a fragmented property merge or exact duplicate
      const propKeys = new Set<string>();
      let totalProps = 0;
      for (const ent of group) {
        if (ent.properties) {
          for (const k of Object.keys(ent.properties)) {
            propKeys.add(k);
            totalProps++;
          }
        }
      }

      if (propKeys.size > 0 && propKeys.size > totalProps / group.length) {
        fragmentsMerged++;
      } else {
        duplicatesMerged++;
      }

      const merged = KnowledgeMerger.mergeEntities(group);
      consolidatedRecords.push(merged);
    }

    // Sort deterministically by canonicalId
    consolidatedRecords.sort((a, b) => a.canonicalId.localeCompare(b.canonicalId));

    // Compute report digest
    const digestPayload = JSON.stringify({
      tenantId: callerTenantId,
      inputCount: entities.length,
      consolidatedCount: consolidatedRecords.length,
      duplicatesMerged,
      fragmentsMerged,
      contradictionsDetected,
      unmergedCount,
      ids: consolidatedRecords.map((r) => r.canonicalId),
    });
    const digest = crypto.createHash('sha256').update(digestPayload).digest('hex');

    const report: ConsolidationReport = Object.freeze({
      tenantId: callerTenantId,
      inputCount: entities.length,
      consolidatedCount: consolidatedRecords.length,
      duplicatesMerged,
      fragmentsMerged,
      contradictionsDetected,
      unmergedCount,
      executionTimeMs: 0,
      digest,
    });

    return Object.freeze({
      records: Object.freeze(consolidatedRecords),
      report,
    });
  }

  /**
   * Consolidates a collection of KnowledgeFact records.
   */
  public static consolidateFacts(
    facts: readonly KnowledgeFact[],
    callerTenantId: string,
    strict: boolean = true
  ): {
    readonly records: readonly ConsolidatedKnowledgeRecord[];
    readonly report: ConsolidationReport;
  } {
    for (const fact of facts) {
      KnowledgeGovernor.assertActuationBlocked(fact.predicate);
      if (fact.tenantId !== callerTenantId) {
        throw new KnowledgeConsolidationTenantViolationError(callerTenantId, fact.tenantId);
      }
    }

    // Partition by subject:predicate to detect contradictions across objects
    const groups = new Map<string, KnowledgeFact[]>();
    for (const f of facts) {
      const key = `${f.subjectId}:${f.predicate}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(f);
    }

    const consolidatedRecords: ConsolidatedKnowledgeRecord[] = [];
    let duplicatesMerged = 0;
    let contradictionsDetected = 0;
    let unmergedCount = 0;

    for (const group of groups.values()) {
      if (group.length === 1) {
        const single = group[0];
        consolidatedRecords.push({
          canonicalId: single.factId,
          objectType: 'FACT',
          consolidatedData: Object.freeze({ ...single }),
          mergedCount: 1,
          constituentIds: Object.freeze([single.factId]),
          lineageSourceIds: Object.freeze([single.factId]),
          evidenceIds: Object.freeze([...single.evidenceIds]),
          finalEpistemicStatus: single.epistemicStatus,
          stateVersion: single.stateVersion,
          checksum: single.checksum,
          tenantId: single.tenantId,
          consolidatedAt: 1000,
        });
        continue;
      }

      // Pre-consolidation contradiction check
      const contradictionCheck = ContradictionDetector.detectFactContradictions(group, strict);
      if (contradictionCheck.hasContradiction) {
        contradictionsDetected++;
        unmergedCount += group.length;
        continue;
      }

      duplicatesMerged++;
      const merged = KnowledgeMerger.mergeFacts(group);
      consolidatedRecords.push(merged);
    }

    consolidatedRecords.sort((a, b) => a.canonicalId.localeCompare(b.canonicalId));

    const digestPayload = JSON.stringify({
      tenantId: callerTenantId,
      inputCount: facts.length,
      consolidatedCount: consolidatedRecords.length,
      duplicatesMerged,
      fragmentsMerged: 0,
      contradictionsDetected,
      unmergedCount: 0,
      ids: consolidatedRecords.map((r) => r.canonicalId),
    });
    const digest = crypto.createHash('sha256').update(digestPayload).digest('hex');

    const report: ConsolidationReport = Object.freeze({
      tenantId: callerTenantId,
      inputCount: facts.length,
      consolidatedCount: consolidatedRecords.length,
      duplicatesMerged,
      fragmentsMerged: 0,
      contradictionsDetected,
      unmergedCount: 0,
      executionTimeMs: 0,
      digest,
    });

    return Object.freeze({
      records: Object.freeze(consolidatedRecords),
      report,
    });
  }
}
