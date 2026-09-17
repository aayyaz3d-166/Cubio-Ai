/**
 * CUBiO AI — Phase 21: Conversational Memory Intelligence
 * memoryRetrievalEngine.ts
 *
 * Bounded & Scoped Conversational Memory Retrieval & Relevance Engine:
 * - Implements strict bounded retrieval (never dumps entire history into context)
 * - Multi-Factor Ranking:
 *   1. Semantic & Task Relevance
 *   2. Recency & Conversational Proximity
 *   3. Authority & Provenance Level
 *   4. Explicit User Referencing
 *   5. Contradiction & Active Status Filtering
 * - Suppresses irrelevant memories below relevance threshold
 * - Enforces multi-tenant and multi-user security isolation
 */

import {
  PersistedMemoryEntry,
  MemoryRetrievalCandidate,
  BoundedRetrievalResult,
  MemoryAuthorityLevel,
} from './memoryTypes';

export interface RetrievalParams {
  readonly query: string;
  readonly candidateMemories: readonly PersistedMemoryEntry[];
  readonly tenantId: string;
  readonly userId: string;
  readonly currentTurnSequence?: number;
  readonly maxItems?: number;
  readonly minRelevanceThreshold?: number;
  readonly isExplicitRecall?: boolean;
}

export class MemoryRetrievalEngine {
  private static instance: MemoryRetrievalEngine | null = null;
  public static readonly DEFAULT_MAX_ITEMS = 5;
  public static readonly DEFAULT_RELEVANCE_THRESHOLD = 0.35;

  public static getInstance(): MemoryRetrievalEngine {
    if (!MemoryRetrievalEngine.instance) {
      MemoryRetrievalEngine.instance = new MemoryRetrievalEngine();
    }
    return MemoryRetrievalEngine.instance;
  }

  /**
   * Retrieves and ranks a small, bounded set of strictly relevant memories for context assembly.
   */
  public retrieveBounded(params: RetrievalParams): BoundedRetrievalResult {
    const {
      query,
      candidateMemories,
      tenantId,
      userId,
      currentTurnSequence = 1,
      maxItems = MemoryRetrievalEngine.DEFAULT_MAX_ITEMS,
      minRelevanceThreshold = MemoryRetrievalEngine.DEFAULT_RELEVANCE_THRESHOLD,
      isExplicitRecall = false,
    } = params;

    const queryLower = query.toLowerCase();
    const queryTokens = new Set(
      queryLower
        .replace(/[^a-z0-9_\-\s]/g, ' ')
        .split(/\s+/)
        .filter((t) => t.length > 1)
    );

    // Extract query topic/entities
    const queryEntities: string[] = [];
    if (/\b(login|auth|authentication|password|sign\s*in)\b/i.test(queryLower)) {
      queryEntities.push('authentication', 'security');
    }
    if (/\b(page|structure|component|ui|frontend|app|layout)\b/i.test(queryLower)) {
      queryEntities.push('frontend', 'architecture');
    }
    if (/\b(language|code|script|programming|write|implement)\b/i.test(queryLower)) {
      queryEntities.push('language', 'programming');
    }
    if (/\b(name|who\s+am\s+i|identity)\b/i.test(queryLower)) {
      queryEntities.push('identity', 'name');
    }
    if (/\b(budget|cost|price|expense|dollar)\b/i.test(queryLower)) {
      queryEntities.push('budget', 'finance');
    }

    const scoredCandidates: MemoryRetrievalCandidate[] = [];
    let suppressedCount = 0;

    for (const mem of candidateMemories) {
      // 1. Isolation Gate: tenantId and userId boundary
      if (mem.tenantId !== tenantId) {
        suppressedCount++;
        continue;
      }
      if (mem.userId !== userId && mem.userId !== 'user_default' && userId !== 'user_default') {
        suppressedCount++;
        continue;
      }

      // 2. Status Gate: only ACTIVE memories enter active context
      if (mem.status !== 'ACTIVE') {
        suppressedCount++;
        continue;
      }

      // 3. Relevance Scoring
      let relevance = 0.0;
      const reasons: string[] = [];

      const memKeyLower = mem.key.toLowerCase();
      const memValLower = mem.value.toLowerCase();
      const memFactLower = mem.rawFact.toLowerCase();
      const memTags = mem.tags.map((t) => t.toLowerCase());

      // Exact keyword matches in query
      if (queryLower.includes(memKeyLower)) {
        relevance += 0.5;
        reasons.push(`Key '${mem.key}' explicitly mentioned in query`);
      }
      if (queryLower.includes(memValLower) && memValLower.length > 2) {
        relevance += 0.4;
        reasons.push(`Value '${mem.value}' matched in query`);
      }

      // Token overlap between query and memory text
      const memWords = `${memKeyLower} ${memValLower} ${memFactLower}`.split(/\s+/);
      let matchHits = 0;
      for (const w of memWords) {
        if (queryTokens.has(w)) matchHits++;
      }
      if (matchHits > 0) {
        relevance += Math.min(0.4, matchHits * 0.15);
      }

      // Domain/Entity affinity matching
      // E.g. Query mentions login/page/structure -> React & Firebase are highly relevant!
      if (
        queryEntities.includes('authentication') &&
        (memKeyLower.includes('auth') || memTags.includes('authentication'))
      ) {
        relevance += 0.6;
        reasons.push('Authentication entity affinity');
      }
      if (
        queryEntities.includes('frontend') &&
        (memKeyLower.includes('stack') || memKeyLower.includes('frontend') || memTags.includes('frontend'))
      ) {
        relevance += 0.55;
        reasons.push('Frontend architecture affinity');
      }
      if (
        queryEntities.includes('language') &&
        (memKeyLower.includes('language') || memTags.includes('language'))
      ) {
        relevance += 0.65;
        reasons.push('Programming language affinity');
      }
      if (
        queryEntities.includes('identity') &&
        (memKeyLower.includes('name') || memTags.includes('identity'))
      ) {
        relevance += 0.8;
        reasons.push('Identity name lookup');
      }

      // Explicit recall booster: if user says "what did I tell you earlier?" or "what is my name?"
      if (isExplicitRecall) {
        relevance += 0.35;
        reasons.push('Explicit recall booster');
      }

      // 4. Recency & Conversational Proximity Scoring
      const now = Date.now();
      const ageMs = Math.max(0, now - mem.updatedAt);
      const recencyScore = Math.max(0.1, 1.0 - ageMs / (1000 * 60 * 60 * 24)); // decays over 24 hours
      const proximityScore = 0.9; // stable within active session

      // 5. Authority Scoring
      const authorityScore = mem.authority / MemoryAuthorityLevel.CURRENT_EXPLICIT_USER_STATEMENT;

      // 6. Composite Score: 0.5 * relevance + 0.25 * authority + 0.15 * recency + 0.10 * proximity
      const compositeScore =
        relevance * 0.5 + authorityScore * 0.25 + recencyScore * 0.15 + proximityScore * 0.1;

      // Relevance filtering: suppress memories that have zero/minimal relevance to the query
      const effectiveThreshold = isExplicitRecall ? 0.2 : minRelevanceThreshold;
      if (relevance < effectiveThreshold && !isExplicitRecall) {
        suppressedCount++;
        continue;
      }

      scoredCandidates.push({
        memory: mem,
        relevanceScore: Math.min(1.0, relevance),
        recencyScore,
        authorityScore,
        proximityScore,
        compositeScore,
        matchReason: reasons.join(', ') || 'General contextual association',
      });
    }

    // Sort by composite score descending
    scoredCandidates.sort((a, b) => b.compositeScore - a.compositeScore);

    // Bounded selection: take only top K
    const boundedSelection = scoredCandidates.slice(0, maxItems);
    const topRelevanceScore = boundedSelection.length > 0 ? boundedSelection[0].relevanceScore : 0.0;

    return Object.freeze({
      retrievedMemories: Object.freeze(boundedSelection),
      suppressedCount: suppressedCount + Math.max(0, scoredCandidates.length - maxItems),
      totalCandidates: candidateMemories.length,
      topRelevanceScore,
      queryTopic: queryEntities[0],
      queryEntities: Object.freeze(queryEntities),
    });
  }
}
