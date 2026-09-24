/**
 * CUBiO AI — Task 186: Native Knowledge Normalization & Canonicalization
 * src/cubio/model/native_knowledge_normalization/predicateNormalizer.ts
 *
 * Predicate Normalizer:
 * Maps natural language predicate variations to canonical relation types,
 * and derives deterministic Canonical Fact IDs.
 */

import * as crypto from 'crypto';
import { KnowledgeGovernor } from '../native_knowledge_architecture/knowledgeGovernor';
import { NormalizationActuationBlockedError } from './types';
import { OutputGuard } from '../../inference/safety/outputGuard';

export class PredicateNormalizer {
  private static readonly CANONICAL_PREDICATES: Readonly<Record<string, string>> = Object.freeze({
    'is a': 'IS_A',
    'is an': 'IS_A',
    'is_a': 'IS_A',
    'isa': 'IS_A',
    'type of': 'IS_A',
    'instance of': 'IS_A',

    'part of': 'PART_OF',
    'part_of': 'PART_OF',
    'component of': 'PART_OF',
    'subsystem of': 'PART_OF',

    'contains': 'CONTAINS',
    'includes': 'CONTAINS',
    'has part': 'CONTAINS',

    'causes': 'CAUSES',
    'triggers': 'CAUSES',
    'leads to': 'CAUSES',

    'derives from': 'DERIVES_FROM',
    'derived from': 'DERIVES_FROM',
    'derives_from': 'DERIVES_FROM',

    'maps to': 'MAPS_TO',
    'maps_to': 'MAPS_TO',
    'corresponds to': 'MAPS_TO',

    'constrains': 'CONSTRAINS',
    'restricts': 'CONSTRAINS',
    'bounds': 'CONSTRAINS',

    'located in': 'LOCATED_IN',
    'located_in': 'LOCATED_IN',
    'situated in': 'LOCATED_IN',
    'situated at': 'LOCATED_IN',

    'resonates at': 'RESONATES_AT',
    'resonates_at': 'RESONATES_AT',
    'oscillates at': 'RESONATES_AT',

    'exhibits': 'HAS_PROPERTY',
    'has property': 'HAS_PROPERTY',
    'has_property': 'HAS_PROPERTY',

    'measures': 'MEASURES',
    'has measurement': 'MEASURES',

    'equal to': 'EQUAL_TO',
    'equals': 'EQUAL_TO',
    'identical to': 'EQUAL_TO',
  });

  /**
   * Normalizes any raw predicate string into its canonical relation representation.
   */
  public static normalizePredicate(rawPredicate: string): string {
    if (!rawPredicate || typeof rawPredicate !== 'string') return 'ASSOCIATED_WITH';

    // Actuation check
    try {
      KnowledgeGovernor.assertActuationBlocked(rawPredicate);
      if (/\b(?:actuate|actuator|dispatch force|physical override|arm motor|drive motor|trigger relay|hardware pulse)\b/i.test(rawPredicate)) {
        throw new NormalizationActuationBlockedError(rawPredicate);
      }
      const verdict = OutputGuard.validateOutput(rawPredicate);
      if (!verdict.isSafe) {
        throw new NormalizationActuationBlockedError(rawPredicate);
      }
    } catch {
      throw new NormalizationActuationBlockedError(rawPredicate);
    }

    const cleaned = rawPredicate
      .normalize('NFKC')
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s_-]/gu, '')
      .replace(/[-_]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (this.CANONICAL_PREDICATES[cleaned]) {
      return this.CANONICAL_PREDICATES[cleaned];
    }

    // Check uppercase if already canonical
    const upper = rawPredicate.trim().toUpperCase();
    if (Object.values(this.CANONICAL_PREDICATES).includes(upper)) {
      return upper;
    }

    return 'ASSOCIATED_WITH';
  }

  /**
   * Derives a deterministic Canonical Fact ID from tenant, subject, predicate, and object.
   */
  public static deriveCanonicalFactId(
    tenantId: string,
    subjectCanonicalId: string,
    predicate: string,
    objectCanonicalId: string
  ): string {
    const canonicalPred = this.normalizePredicate(predicate);
    const payload = `CANON_FACT:${tenantId}:${subjectCanonicalId}:${canonicalPred}:${objectCanonicalId}`;
    const hash = crypto.createHash('sha256').update(payload, 'utf8').digest('hex').slice(0, 24);
    return `canon_fact_${hash}`;
  }
}
