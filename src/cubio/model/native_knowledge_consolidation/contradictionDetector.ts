/**
 * CUBiO AI — Task 191: Native Knowledge Consolidation
 * src/cubio/model/native_knowledge_consolidation/contradictionDetector.ts
 *
 * Deterministic Contradiction Detector:
 * Scans candidate knowledge records for direct value conflicts,
 * predicate inversions, and epistemic disputes prior to consolidation.
 */

import {
  ContradictionDetectionResult,
  KnowledgeContradictionError,
} from './types';
import {
  KnowledgeEntity,
  KnowledgeFact,
  EPISTEMIC_WEIGHTS,
} from '../native_knowledge_architecture/types';

export class ContradictionDetector {
  /**
   * Scans a group of equivalent entities for conflicting properties.
   */
  public static detectEntityContradictions(
    entities: readonly KnowledgeEntity[],
    strict: boolean = true
  ): ContradictionDetectionResult {
    if (entities.length <= 1) {
      return { hasContradiction: false, conflictingIds: [] };
    }

    const seenProperties = new Map<string, { value: unknown; entityId: string }>();

    for (const ent of entities) {
      if (!ent.properties) continue;

      for (const [propKey, propVal] of Object.entries(ent.properties)) {
        if (propVal === undefined || propVal === null) continue;

        if (seenProperties.has(propKey)) {
          const prior = seenProperties.get(propKey)!;

          // Check if values are contradictory
          if (this.isContradictoryValue(prior.value, propVal)) {
            const conflictingIds = [prior.entityId, ent.entityId];
            const reason = `Conflicting values for property "${propKey}": "${JSON.stringify(
              prior.value
            )}" vs "${JSON.stringify(propVal)}"`;

            if (strict) {
              throw new KnowledgeContradictionError(conflictingIds, reason);
            }
            return {
              hasContradiction: true,
              conflictType: 'DIRECT_VALUE_CONFLICT',
              conflictingIds,
              reason,
            };
          }
        } else {
          seenProperties.set(propKey, { value: propVal, entityId: ent.entityId });
        }
      }
    }

    return { hasContradiction: false, conflictingIds: [] };
  }

  /**
   * Scans a group of equivalent facts for semantic or truth-value contradictions.
   */
  public static detectFactContradictions(
    facts: readonly KnowledgeFact[],
    strict: boolean = true
  ): ContradictionDetectionResult {
    if (facts.length <= 1) {
      return { hasContradiction: false, conflictingIds: [] };
    }

    // Check for conflicting objects on the same subject and predicate
    const baseline = facts[0];
    for (let i = 1; i < facts.length; i++) {
      const candidate = facts[i];

      // Mutually exclusive objects
      if (
        candidate.subjectId === baseline.subjectId &&
        candidate.predicate === baseline.predicate &&
        candidate.objectId !== baseline.objectId
      ) {
        // Check epistemic hierarchy: is lower epistemic disputing a canonical FACT/AXIOM?
        const baseRank = EPISTEMIC_WEIGHTS[baseline.epistemicStatus];
        const candRank = EPISTEMIC_WEIGHTS[candidate.epistemicStatus];

        let conflictType: 'DIRECT_VALUE_CONFLICT' | 'EPISTEMIC_CONFLICT' = 'DIRECT_VALUE_CONFLICT';
        if (baseRank >= EPISTEMIC_WEIGHTS.FACT && candRank <= EPISTEMIC_WEIGHTS.HYPOTHESIS) {
          conflictType = 'EPISTEMIC_CONFLICT';
        }

        const conflictingIds = [baseline.factId, candidate.factId];
        const reason = `Contradictory objects for (${baseline.subjectId} ${baseline.predicate}): "${baseline.objectId}" vs "${candidate.objectId}"`;

        if (strict) {
          throw new KnowledgeContradictionError(conflictingIds, reason);
        }
        return {
          hasContradiction: true,
          conflictType,
          conflictingIds,
          reason,
        };
      }
    }

    return { hasContradiction: false, conflictingIds: [] };
  }

  /**
   * Evaluates whether two values are directly contradictory.
   */
  private static isContradictoryValue(val1: unknown, val2: unknown): boolean {
    // If exact match, not contradictory
    if (val1 === val2) return false;

    // Boolean inversion: true vs false
    if (typeof val1 === 'boolean' && typeof val2 === 'boolean') {
      return val1 !== val2;
    }

    // String mutually exclusive opposites
    if (typeof val1 === 'string' && typeof val2 === 'string') {
      const s1 = val1.trim().toUpperCase();
      const s2 = val2.trim().toUpperCase();
      if (s1 === s2) return false;

      const OPPOSITES: [string, string][] = [
        ['FERMION', 'BOSON'],
        ['CONDUCTOR', 'INSULATOR'],
        ['POSITIVE', 'NEGATIVE'],
        ['METALLIC', 'INSULATING'],
        ['SPIN_UP', 'SPIN_DOWN'],
        ['ENABLE', 'DISABLE'],
        ['ACTIVE', 'INACTIVE'],
      ];

      for (const [opA, opB] of OPPOSITES) {
        if ((s1 === opA && s2 === opB) || (s1 === opB && s2 === opA)) {
          return true;
        }
      }

      // If both are distinct non-empty string literals for single-valued scalar property
      return true;
    }

    // Number difference for constant physical values
    if (typeof val1 === 'number' && typeof val2 === 'number') {
      return Math.abs(val1 - val2) > 1e-6;
    }

    return false;
  }
}
