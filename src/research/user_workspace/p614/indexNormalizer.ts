/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.14: Index & Search Normalizer
 *
 * Provides derived-only normalization for search queries and entity fields.
 * Does NOT modify authoritative source data.
 */

import { IndexedEntity } from './types';

export class IndexNormalizer {
  /**
   * Normalize search text: lowercase, trimmed, collapsed whitespace.
   */
  public static normalizeText(input: string): string {
    if (!input) return '';
    return input.trim().toLowerCase().replace(/\s+/g, ' ');
  }

  /**
   * Tokenize normalized search text.
   */
  public static tokenize(input: string): readonly string[] {
    const normalized = IndexNormalizer.normalizeText(input);
    if (!normalized) return Object.freeze([]);
    return Object.freeze(normalized.split(' ').filter(Boolean));
  }

  /**
   * Normalize an ID for exact/prefix comparisons.
   */
  public static normalizeId(id: string): string {
    if (!id) return '';
    return id.trim().toUpperCase();
  }

  /**
   * Derive a search corpus string from an entity without modifying the entity.
   */
  public static deriveSearchCorpus(entity: IndexedEntity): string {
    const parts: string[] = [
      entity.entityId,
      entity.title,
      entity.name,
      entity.entityType,
      entity.description ?? '',
      ...(entity.tags ?? []),
      entity.spaceId ?? '',
      entity.experimentId ?? '',
      entity.versionId ?? '',
      entity.stateId ?? '',
      entity.checksum ?? '',
      entity.certainty ?? '',
    ];

    return IndexNormalizer.normalizeText(parts.filter(Boolean).join(' '));
  }

  /**
   * Check if text matches tokenized keywords.
   */
  public static matchesTokens(corpus: string, tokens: readonly string[]): boolean {
    if (tokens.length === 0) return true;
    return tokens.every((token) => corpus.includes(token));
  }
}
