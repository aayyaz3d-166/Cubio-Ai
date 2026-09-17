/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.14: Deterministic Search Ranking
 *
 * Ranks search results according to deterministic precedence:
 * 1. Exact ID match (1000)
 * 2. Exact title / name match (800)
 * 3. Exact entity type match (600)
 * 4. Prefix match (400)
 * 5. Token match (200)
 * 6. Partial substring match (100)
 *
 * Tie-breaking is strictly deterministic (entityId lexical ordering).
 */

import { IndexedEntity, SearchResult, MatchType } from './types';
import { IndexNormalizer } from './indexNormalizer';
import { generateDeterministicSearchResultId } from './determinism';

export class SearchRankingEngine {
  /**
   * Evaluate relevance and produce a SearchResult with matchType and score.
   */
  public static evaluateMatch(
    entity: IndexedEntity,
    queryText: string,
    querySignature: string
  ): SearchResult | null {
    const rawQuery = queryText.trim();
    if (!rawQuery) {
      // Empty query matches all with base score
      const resultId = generateDeterministicSearchResultId(querySignature, entity.entityId);
      return Object.freeze({
        resultId,
        entity,
        score: 10,
        matchType: 'METADATA',
        highlights: Object.freeze([]),
      });
    }

    const normQuery = IndexNormalizer.normalizeText(rawQuery);
    const normId = IndexNormalizer.normalizeId(rawQuery);
    const entityIdUpper = entity.entityId.toUpperCase();
    const titleNorm = IndexNormalizer.normalizeText(entity.title);
    const nameNorm = IndexNormalizer.normalizeText(entity.name);
    const typeNorm = IndexNormalizer.normalizeText(entity.entityType);
    const corpus = IndexNormalizer.deriveSearchCorpus(entity);
    const tokens = IndexNormalizer.tokenize(rawQuery);

    let score = 0;
    let matchType: MatchType = 'METADATA';
    const highlights: string[] = [];

    // 1. Exact ID match
    if (entityIdUpper === normId) {
      score = 1000;
      matchType = 'EXACT_ID';
      highlights.push(`id:${entity.entityId}`);
    }
    // 2. Exact title or name match
    else if (titleNorm === normQuery || nameNorm === normQuery) {
      score = 800;
      matchType = 'EXACT_TITLE';
      highlights.push(`title:${entity.title}`);
    }
    // 3. Exact entity type match
    else if (typeNorm === normQuery) {
      score = 600;
      matchType = 'EXACT_TYPE';
      highlights.push(`type:${entity.entityType}`);
    }
    // 4. Prefix match on ID or title
    else if (
      entityIdUpper.startsWith(normId) ||
      titleNorm.startsWith(normQuery) ||
      nameNorm.startsWith(normQuery)
    ) {
      score = 400;
      matchType = 'PREFIX';
      highlights.push(entityIdUpper.startsWith(normId) ? `id_prefix:${entity.entityId}` : `title_prefix:${entity.title}`);
    }
    // 5. Full token match across corpus
    else if (IndexNormalizer.matchesTokens(corpus, tokens)) {
      score = 200;
      matchType = 'TOKEN';
      highlights.push(`tokens:${tokens.join(',')}`);
    }
    // 6. Substring match
    else if (corpus.includes(normQuery)) {
      score = 100;
      matchType = 'SUBSTRING';
      highlights.push(`substring:${normQuery}`);
    } else {
      // No match
      return null;
    }

    const resultId = generateDeterministicSearchResultId(querySignature, entity.entityId);

    return Object.freeze({
      resultId,
      entity,
      score,
      matchType,
      highlights: Object.freeze(highlights),
    });
  }

  /**
   * Sort search results deterministically by score descending, then by entityId ascending.
   */
  public static sortResults(
    results: readonly SearchResult[],
    field: 'RELEVANCE' | 'NAME' | 'CREATED_AT' | 'UPDATED_AT' | 'TYPE' = 'RELEVANCE',
    order: 'ASC' | 'DESC' = 'DESC'
  ): readonly SearchResult[] {
    const sorted = [...results].sort((a, b) => {
      let cmp = 0;

      if (field === 'RELEVANCE') {
        cmp = b.score - a.score;
      } else if (field === 'NAME') {
        cmp = a.entity.title.localeCompare(b.entity.title);
      } else if (field === 'CREATED_AT') {
        cmp = a.entity.createdAt - b.entity.createdAt;
      } else if (field === 'UPDATED_AT') {
        cmp = a.entity.updatedAt - b.entity.updatedAt;
      } else if (field === 'TYPE') {
        cmp = a.entity.entityType.localeCompare(b.entity.entityType);
      }

      if (cmp !== 0) {
        return order === 'ASC' && field !== 'RELEVANCE' ? cmp : order === 'DESC' && field !== 'RELEVANCE' ? -cmp : cmp;
      }

      // Stable deterministic tie-breaker: entityId ascending
      return a.entity.entityId.localeCompare(b.entity.entityId);
    });

    return Object.freeze(sorted);
  }
}
