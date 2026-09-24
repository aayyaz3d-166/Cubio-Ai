/**
 * CUBiO AI — Task 192: Native Knowledge Contradiction Detection and Resolution
 * src/cubio/model/native_knowledge_contradiction/contradictionScanner.ts
 *
 * Deterministic Contradiction Scanner:
 * Scans facts, relationships, evidence, and historical states for semantic,
 * epistemic, logical, and concurrency contradictions.
 */

import * as crypto from 'crypto';
import {
  ContradictionConflictType,
  ContradictionSeverity,
  ConflictRecord,
  HistoricalStateRecord,
  KnowledgeContradictionTenantViolationError,
  MAX_CONTRADICTION_SCAN_LIMIT,
} from './types';
import {
  KnowledgeEntity,
  KnowledgeFact,
  Relationship,
  Evidence,
  EPISTEMIC_WEIGHTS,
} from '../native_knowledge_architecture/types';

export class ContradictionScanner {
  /**
   * Scans a set of facts for contradictions (e.g. same subject & predicate with conflicting objects/values).
   */
  public static scanFacts(
    facts: readonly KnowledgeFact[],
    tenantId: string
  ): readonly ConflictRecord[] {
    this.enforceScanLimit(facts.length);
    const conflicts: ConflictRecord[] = [];
    const grouped = new Map<string, KnowledgeFact[]>();

    for (const fact of facts) {
      if (fact.tenantId !== tenantId) {
        throw new KnowledgeContradictionTenantViolationError(
          `Fact '${fact.factId}' tenant '${fact.tenantId}' does not match expected tenant '${tenantId}'`
        );
      }

      const key = `${fact.subjectId}:::${fact.predicate}`;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(fact);
    }

    for (const [key, group] of grouped.entries()) {
      if (group.length <= 1) continue;

      for (let i = 0; i < group.length; i++) {
        for (let j = i + 1; j < group.length; j++) {
          const f1 = group[i];
          const f2 = group[j];

          // Check for object mismatch
          if (this.areObjectsContradictory(f1.objectId, f2.objectId, f1.properties, f2.properties)) {
            const conflictId = this.generateConflictId(f1.factId, f2.factId, 'FACT_CONFLICT');
            const w1 = EPISTEMIC_WEIGHTS[f1.epistemicStatus] ?? 0.5;
            const w2 = EPISTEMIC_WEIGHTS[f2.epistemicStatus] ?? 0.5;
            const severity: ContradictionSeverity = Math.abs(w1 - w2) > 0.4 ? 'CRITICAL' : 'HIGH';

            conflicts.push({
              conflictId,
              tenantId,
              conflictType: 'FACT_CONFLICT',
              severity,
              conflictingRecordIds: [f1.factId, f2.factId],
              records: [f1, f2],
              reason: `Fact conflict on subject '${f1.subjectId}' and predicate '${f1.predicate}': '${f1.objectId}' vs '${f2.objectId}'`,
              detectedAt: 1000,
            });
          }
        }
      }
    }

    return conflicts;
  }

  /**
   * Scans relationships for logical contradictions (e.g. mutual exclusion, cycle in asymmetric relations).
   */
  public static scanRelationships(
    relationships: readonly Relationship[],
    tenantId: string
  ): readonly ConflictRecord[] {
    this.enforceScanLimit(relationships.length);
    const conflicts: ConflictRecord[] = [];

    for (let i = 0; i < relationships.length; i++) {
      const r1 = relationships[i];
      if (r1.tenantId !== tenantId) {
        throw new KnowledgeContradictionTenantViolationError(
          `Relationship '${r1.relationshipId}' tenant '${r1.tenantId}' does not match expected tenant '${tenantId}'`
        );
      }

      for (let j = i + 1; j < relationships.length; j++) {
        const r2 = relationships[j];
        if (r2.tenantId !== tenantId) {
          throw new KnowledgeContradictionTenantViolationError(
            `Relationship '${r2.relationshipId}' tenant '${r2.tenantId}' does not match expected tenant '${tenantId}'`
          );
        }

        // Direct pair contradiction: same source and target, but opposing relationship types
        if (r1.sourceEntityId === r2.sourceEntityId && r1.targetEntityId === r2.targetEntityId) {
          if (this.areRelationshipTypesMutuallyExclusive(r1.relationshipType, r2.relationshipType)) {
            const conflictId = this.generateConflictId(r1.relationshipId, r2.relationshipId, 'RELATIONSHIP_CONFLICT');
            conflicts.push({
              conflictId,
              tenantId,
              conflictType: 'RELATIONSHIP_CONFLICT',
              severity: 'CRITICAL',
              conflictingRecordIds: [r1.relationshipId, r2.relationshipId],
              records: [r1, r2],
              reason: `Mutually exclusive relationships between '${r1.sourceEntityId}' and '${r1.targetEntityId}': '${r1.relationshipType}' vs '${r2.relationshipType}'`,
              detectedAt: 1000,
            });
          }
        }

        // Inverse asymmetric contradiction: A PART_OF B and B PART_OF A
        if (r1.sourceEntityId === r2.targetEntityId && r1.targetEntityId === r2.sourceEntityId) {
          if (this.isAsymmetricRelationship(r1.relationshipType) && r1.relationshipType === r2.relationshipType) {
            const conflictId = this.generateConflictId(r1.relationshipId, r2.relationshipId, 'RELATIONSHIP_CONFLICT');
            conflicts.push({
              conflictId,
              tenantId,
              conflictType: 'RELATIONSHIP_CONFLICT',
              severity: 'CRITICAL',
              conflictingRecordIds: [r1.relationshipId, r2.relationshipId],
              records: [r1, r2],
              reason: `Circular asymmetric relationship detected for type '${r1.relationshipType}' between '${r1.sourceEntityId}' and '${r1.targetEntityId}'`,
              detectedAt: 1000,
            });
          }
        }
      }
    }

    return conflicts;
  }

  /**
   * Scans evidence records for contradictory claims or measurements.
   */
  public static scanEvidence(
    evidenceList: readonly Evidence[],
    tenantId: string
  ): readonly ConflictRecord[] {
    this.enforceScanLimit(evidenceList.length);
    const conflicts: ConflictRecord[] = [];

    // Group evidence by target claim/source key
    const grouped = new Map<string, Evidence[]>();
    for (const ev of evidenceList) {
      if (ev.tenantId !== tenantId) {
        throw new KnowledgeContradictionTenantViolationError(
          `Evidence '${ev.evidenceId}' tenant '${ev.tenantId}' does not match expected tenant '${tenantId}'`
        );
      }
      const key = `${ev.sourceType}:::${ev.sourceLocation}`;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(ev);
    }

    for (const [key, group] of grouped.entries()) {
      if (group.length <= 1) continue;

      for (let i = 0; i < group.length; i++) {
        for (let j = i + 1; j < group.length; j++) {
          const e1 = group[i];
          const e2 = group[j];

          // Conflicting evidence: exact same location but divergent payload checksum or contradictory confidence metrics
          if (e1.checksum !== e2.checksum) {
            const conflictId = this.generateConflictId(e1.evidenceId, e2.evidenceId, 'EVIDENCE_CONFLICT');
            conflicts.push({
              conflictId,
              tenantId,
              conflictType: 'EVIDENCE_CONFLICT',
              severity: 'HIGH',
              conflictingRecordIds: [e1.evidenceId, e2.evidenceId],
              records: [e1, e2],
              reason: `Divergent checksums for identical evidence source '${key}': '${e1.checksum}' vs '${e2.checksum}'`,
              detectedAt: 1000,
            });
          }
        }
      }
    }

    return conflicts;
  }

  /**
   * Scans historical state transitions for OCC forks (e.g. same version, different checksums).
   */
  public static scanHistoricalStates(
    states: readonly HistoricalStateRecord[],
    tenantId: string
  ): readonly ConflictRecord[] {
    this.enforceScanLimit(states.length);
    const conflicts: ConflictRecord[] = [];

    const grouped = new Map<string, HistoricalStateRecord[]>();
    for (const st of states) {
      if (st.tenantId !== tenantId) {
        throw new KnowledgeContradictionTenantViolationError(
          `Historical state for '${st.canonicalId}' tenant '${st.tenantId}' does not match expected tenant '${tenantId}'`
        );
      }
      if (!grouped.has(st.canonicalId)) {
        grouped.set(st.canonicalId, []);
      }
      grouped.get(st.canonicalId)!.push(st);
    }

    for (const [canonicalId, history] of grouped.entries()) {
      const versionMap = new Map<number, HistoricalStateRecord>();

      for (const entry of history) {
        if (versionMap.has(entry.stateVersion)) {
          const prior = versionMap.get(entry.stateVersion)!;
          if (prior.payloadHash !== entry.payloadHash || prior.checksum !== entry.checksum) {
            const conflictId = this.generateConflictId(
              `${canonicalId}-v${entry.stateVersion}-a`,
              `${canonicalId}-v${entry.stateVersion}-b`,
              'HISTORICAL_STATE_CONFLICT'
            );
            conflicts.push({
              conflictId,
              tenantId,
              conflictType: 'HISTORICAL_STATE_CONFLICT',
              severity: 'CRITICAL',
              conflictingRecordIds: [
                `${canonicalId}@v${prior.stateVersion}`,
                `${canonicalId}@v${entry.stateVersion}`,
              ],
              records: [prior, entry],
              reason: `OCC Version Fork: Canonical ID '${canonicalId}' has conflicting payload hashes at stateVersion ${entry.stateVersion}`,
              detectedAt: 1000,
            });
          }
        } else {
          versionMap.set(entry.stateVersion, entry);
        }
      }
    }

    return conflicts;
  }

  /**
   * Evaluates if two fact objects or property sets are contradictory.
   */
  private static areObjectsContradictory(
    obj1: string,
    obj2: string,
    props1?: Record<string, unknown>,
    props2?: Record<string, unknown>
  ): boolean {
    if (obj1 !== obj2) {
      return true;
    }

    if (props1 && props2) {
      for (const [key, val1] of Object.entries(props1)) {
        if (val1 !== undefined && val1 !== null && props2[key] !== undefined && props2[key] !== null) {
          if (JSON.stringify(val1) !== JSON.stringify(props2[key])) {
            return true;
          }
        }
      }
    }

    return false;
  }

  /**
   * Evaluates if two relationship types are mutually exclusive.
   */
  private static areRelationshipTypesMutuallyExclusive(typeA: string, typeB: string): boolean {
    const exclusivePairs: Array<[string, string]> = [
      ['IS_A', 'INDEPENDENT_OF'],
      ['PART_OF', 'INDEPENDENT_OF'],
      ['CAUSES', 'PREVENTS'],
      ['ENABLES', 'INHIBITS'],
      ['SIMILAR_TO', 'OPPOSITE_OF'],
      ['IDENTICAL_TO', 'DISTINCT_FROM'],
    ];

    for (const [p1, p2] of exclusivePairs) {
      if ((typeA === p1 && typeB === p2) || (typeA === p2 && typeB === p1)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Identifies asymmetric relationships where (A rel B) precludes (B rel A).
   */
  private static isAsymmetricRelationship(type: string): boolean {
    const asymmetric = new Set(['PART_OF', 'SUBCLASS_OF', 'CAUSES', 'DEPENDS_ON', 'PARENT_OF']);
    return asymmetric.has(type);
  }

  /**
   * Deterministic conflict ID generator.
   */
  public static generateConflictId(
    idA: string,
    idB: string,
    conflictType: ContradictionConflictType
  ): string {
    const sorted = [idA, idB].sort().join(':::');
    const hash = crypto
      .createHash('sha256')
      .update(`${conflictType}:::${sorted}`)
      .digest('hex')
      .slice(0, 16);
    return `CONFLICT-${hash}`;
  }

  private static enforceScanLimit(count: number): void {
    if (count > MAX_CONTRADICTION_SCAN_LIMIT) {
      throw new Error(
        `[TASK-192] Scan count ${count} exceeds maximum contradiction scan limit of ${MAX_CONTRADICTION_SCAN_LIMIT}`
      );
    }
  }
}
