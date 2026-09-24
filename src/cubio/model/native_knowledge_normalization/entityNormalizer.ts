/**
 * CUBiO AI — Task 186: Native Knowledge Normalization & Canonicalization
 * src/cubio/model/native_knowledge_normalization/entityNormalizer.ts
 *
 * Deterministic Entity Normalizer:
 * Normalizes entity strings (case, Unicode, punctuation, whitespace),
 * resolves aliases, and derives bitwise stable canonical IDs.
 */

import * as crypto from 'crypto';
import { KnowledgeGovernor } from '../native_knowledge_architecture/knowledgeGovernor';
import { NormalizationActuationBlockedError } from './types';

export class EntityNormalizer {
  /**
   * Normalizes an entity string into canonical text form:
   * - Unicode NFKC normalization
   * - Trim leading/trailing whitespace and punctuation
   * - Lowercase folding
   * - Replace dashes/underscores with single space
   * - Collapse multiple whitespaces
   */
  public static normalizeName(rawName: string): string {
    if (!rawName || typeof rawName !== 'string') return '';

    // Actuation check
    try {
      KnowledgeGovernor.assertActuationBlocked(rawName);
    } catch {
      throw new NormalizationActuationBlockedError(rawName);
    }

    return rawName
      .normalize('NFKC')
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s_-]/gu, '') // Remove special punctuation, keep letters, numbers, spaces, -, _
      .replace(/[-_]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Derives a deterministic Canonical Entity ID from tenant, category, and normalized name.
   */
  public static deriveCanonicalEntityId(
    tenantId: string,
    category: string,
    rawName: string
  ): string {
    const normalizedName = this.normalizeName(rawName);
    const normalizedCategory = category.trim().toUpperCase();

    const payload = `CANON_ENT:${tenantId}:${normalizedCategory}:${normalizedName}`;
    const hash = crypto.createHash('sha256').update(payload, 'utf8').digest('hex').slice(0, 24);
    return `canon_ent_${hash}`;
  }

  /**
   * Checks if two entity names are equivalent under normalization.
   */
  public static areEquivalent(nameA: string, nameB: string): boolean {
    return this.normalizeName(nameA) === this.normalizeName(nameB);
  }

  /**
   * Selects the most formal/representative primary display name among a set of aliases.
   * Prefers PascalCase/Capitalized names over all-lowercase.
   */
  public static selectPrimaryName(candidates: readonly string[]): string {
    if (candidates.length === 0) return '';
    if (candidates.length === 1) return candidates[0].trim();

    // Prefer name with title casing / upper letters
    let best = candidates[0].trim();
    let bestScore = -1;

    for (const name of candidates) {
      const trimmed = name.trim();
      let score = 0;
      if (/^[A-Z]/.test(trimmed)) score += 5; // Starts with uppercase
      if (/[A-Z]/.test(trimmed.slice(1))) score += 3; // Contains inner uppercase
      if (!trimmed.includes('_') && !trimmed.includes('-')) score += 2; // Clean spacing
      if (trimmed.length >= 3) score += 1;

      if (score > bestScore) {
        bestScore = score;
        best = trimmed;
      }
    }

    return best;
  }
}
