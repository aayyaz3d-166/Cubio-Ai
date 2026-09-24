/**
 * CUBiO AI — 3D Memory Studio
 * AGENT-001 — MEA (Memory Agent)
 * src/cubio/agents/mea/relevanceFilter.ts
 *
 * Deterministic relevance ranking, scoring, and deduplication engine.
 * Ensures bit-exact reproducible ordering and noise suppression.
 */

import { MEAQuery, MEARetrievedItem } from './types';

export class MEARelevanceFilter {
  /**
   * Computes normalized relevance score in [0.0, 1.0] for an item against a query.
   */
  public static scoreItem(item: MEARetrievedItem, query: MEAQuery): number {
    let score = 0.0;

    // 1. Task ID exact match
    if (query.taskIds && query.taskIds.length > 0) {
      const itemTaskId = (item.metadata.taskId as string) || '';
      const matched = query.taskIds.some(
        (tid) =>
          item.id.toLowerCase().includes(tid.toLowerCase()) ||
          itemTaskId.toLowerCase() === tid.toLowerCase() ||
          item.title.toLowerCase().includes(tid.toLowerCase())
      );
      if (matched) {
        score += 0.4;
      }
    }

    // 2. Subsystem exact/partial match
    if (query.subsystems && query.subsystems.length > 0) {
      const itemSubsystem = (item.metadata.subsystem as string) || '';
      const matched = query.subsystems.some(
        (sub) =>
          itemSubsystem.toUpperCase() === sub.toUpperCase() ||
          item.title.toUpperCase().includes(sub.toUpperCase()) ||
          item.sourcePathOrKey.toUpperCase().includes(sub.toUpperCase())
      );
      if (matched) {
        score += 0.3;
      }
    }

    // 3. Keyword scoring with frequency & title boosting (up to 0.6)
    if (query.keywords && query.keywords.length > 0) {
      let keywordHits = 0;
      const lowerTitle = item.title.toLowerCase();
      const lowerSnippet = item.snippet.toLowerCase();
      const lowerPath = item.sourcePathOrKey.toLowerCase();

      for (const kw of query.keywords) {
        const cleanKw = kw.trim().toLowerCase();
        if (!cleanKw) continue;

        let hit = false;
        if (lowerTitle.includes(cleanKw)) {
          keywordHits += 1.5; // Title bonus
          hit = true;
        }
        if (lowerSnippet.includes(cleanKw)) {
          keywordHits += 1.0;
          hit = true;
        }
        if (!hit && lowerPath.includes(cleanKw)) {
          keywordHits += 0.5;
        }
      }

      const maxPossibleHits = query.keywords.length * 1.5;
      const keywordRatio = Math.min(1.0, keywordHits / Math.max(1, maxPossibleHits));
      score += keywordRatio * 0.6;
    }

    // 4. File pattern matching
    if (query.filePatterns && query.filePatterns.length > 0) {
      const matched = query.filePatterns.some((pat) =>
        item.sourcePathOrKey.toLowerCase().includes(pat.toLowerCase())
      );
      if (matched) {
        score += 0.2;
      }
    }

    // 5. Spatial coordinate matching
    if (query.cellId !== undefined) {
      const itemCell = item.metadata.cellId as number | undefined;
      if (itemCell !== undefined && itemCell === query.cellId) {
        score += 0.4;
      }
    }
    if (query.address369 !== undefined) {
      const itemAddr = String(item.metadata.address369 || '');
      if (itemAddr.trim().toLowerCase() === String(query.address369).trim().toLowerCase()) {
        score += 0.4;
      }
    }

    // If no specific filters were specified, baseline relevance is assigned based on content presence
    if (
      !query.taskIds?.length &&
      !query.subsystems?.length &&
      !query.keywords?.length &&
      !query.filePatterns?.length &&
      query.cellId === undefined &&
      !query.address369
    ) {
      score = 0.5;
    }

    return Math.min(1.0, Math.max(0.0, Number(score.toFixed(4))));
  }

  /**
   * Filters, scores, deduplicates, and sorts candidates deterministically.
   */
  public static processCandidates(
    candidates: readonly MEARetrievedItem[],
    query: MEAQuery
  ): readonly MEARetrievedItem[] {
    const minCutoff = query.minRelevanceScore !== undefined ? query.minRelevanceScore : 0.05;

    // 1. Rescore and filter by cutoff
    const scored: MEARetrievedItem[] = [];
    for (const c of candidates) {
      const finalScore = this.scoreItem(c, query);
      if (finalScore >= minCutoff) {
        scored.push({
          ...c,
          relevanceScore: finalScore,
        });
      }
    }

    // 2. Deterministic deduplication (keep highest scoring item for same ID/provenance)
    const dedupMap = new Map<string, MEARetrievedItem>();
    for (const item of scored) {
      const dedupKey = `${item.sourceType}:${item.id}`;
      const existing = dedupMap.get(dedupKey);
      if (!existing || item.relevanceScore > existing.relevanceScore) {
        dedupMap.set(dedupKey, item);
      }
    }

    const uniqueItems = Array.from(dedupMap.values());

    // 3. Deterministic sort: Primary = relevanceScore DESC, Secondary = id ASC (lexicographical)
    uniqueItems.sort((a, b) => {
      if (b.relevanceScore !== a.relevanceScore) {
        return b.relevanceScore - a.relevanceScore;
      }
      return a.id.localeCompare(b.id);
    });

    return Object.freeze(uniqueItems);
  }
}
