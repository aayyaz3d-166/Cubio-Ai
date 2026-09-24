/**
 * CUBiO AI — Task 189: Native Knowledge Indexing and Retrieval
 * src/cubio/model/native_knowledge_retrieval/knowledgeRetrievalEngine.ts
 *
 * Bounded Selective Knowledge Retrieval Engine:
 * Implements candidate filtering, multi-factor scoring, Phase 12-compliant
 * deterministic pagination, and SHA-256 retrieval digest calculation.
 */

import * as crypto from 'crypto';
import {
  KnowledgeRetrievalQuery,
  KnowledgeRetrievalPageResult,
  KnowledgeRetrievalRankedItem,
  KnowledgeIndexEntry,
  RetrievalPagingLimitError,
} from './types';
import { KnowledgeIndex } from './knowledgeIndex';
import { KnowledgeRanker } from './knowledgeRanker';
import { KnowledgeGovernor } from '../native_knowledge_architecture/knowledgeGovernor';
import { KnowledgeSpatialBridge } from '../native_knowledge_architecture/knowledgeSpatialBridge';

export class KnowledgeRetrievalEngine {
  public static readonly MAX_PAGE_SIZE = 100;
  public static readonly DEFAULT_PAGE_SIZE = 20;

  private readonly index: KnowledgeIndex;

  constructor(index: KnowledgeIndex) {
    this.index = index;
  }

  /**
   * Executes selective, paged retrieval over lightweight index entries.
   */
  public search(query: KnowledgeRetrievalQuery): KnowledgeRetrievalPageResult {
    KnowledgeGovernor.assertActuationBlocked(query.query);

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? KnowledgeRetrievalEngine.DEFAULT_PAGE_SIZE;
    const minScore = query.minScore ?? 0.10;

    if (page < 1) {
      throw new RetrievalPagingLimitError('page', page, 1);
    }
    if (pageSize > KnowledgeRetrievalEngine.MAX_PAGE_SIZE || pageSize < 1) {
      throw new RetrievalPagingLimitError('pageSize', pageSize, KnowledgeRetrievalEngine.MAX_PAGE_SIZE);
    }

    const queryTokens = KnowledgeIndex.tokenize(query.query);
    const candidateIdSet = new Set<string>();

    // 1. Candidate lookup via inverted token index
    if (queryTokens.length > 0) {
      for (const token of queryTokens) {
        const ids = this.index.getCandidateObjectIdsByToken(token, query.tenantId);
        for (const id of ids) candidateIdSet.add(id);
      }
    }

    // 2. Candidate lookup via spatial address index if focal address provided
    if (query.spatialFocalAddress !== undefined) {
      const spatialIds = this.index.getCandidateObjectIdsBySpatialAddress(
        query.spatialFocalAddress,
        query.tenantId
      );
      for (const id of spatialIds) candidateIdSet.add(id);
    }

    // If query is empty and no focal address, scan all tenant entries
    let candidateEntries: KnowledgeIndexEntry[];
    if (candidateIdSet.size > 0) {
      candidateEntries = [];
      for (const id of candidateIdSet) {
        const entry = this.index.getEntry(id, query.tenantId);
        if (entry) candidateEntries.push(entry);
      }
    } else {
      candidateEntries = [...this.index.getAllEntries(query.tenantId)];
    }

    // 3. Facet Filtering
    const typeFilter = query.objectTypes ? new Set(query.objectTypes) : null;
    const epistemicFilter = query.epistemicFilter ? new Set(query.epistemicFilter) : null;
    const categoryFilter = query.categoryFilter
      ? new Set(query.categoryFilter.map((c) => c.toLowerCase()))
      : null;

    const filteredCandidates: KnowledgeIndexEntry[] = [];
    for (const entry of candidateEntries) {
      if (typeFilter && !typeFilter.has(entry.objectType)) continue;
      if (epistemicFilter && !epistemicFilter.has(entry.epistemicStatus)) continue;
      if (categoryFilter && !categoryFilter.has(entry.category.toLowerCase())) continue;

      if (query.spatialFocalAddress !== undefined && query.spatialMaxRadius !== undefined) {
        const dist = KnowledgeSpatialBridge.manhattanDistance(
          query.spatialFocalAddress,
          entry.address369
        );
        if (dist > query.spatialMaxRadius) continue;
      }

      filteredCandidates.push(entry);
    }

    // 4. Multi-Factor Scoring
    const scoredItems: KnowledgeRetrievalRankedItem[] = [];
    for (const entry of filteredCandidates) {
      const scored = KnowledgeRanker.scoreEntry(entry, query, queryTokens);
      if (scored.compositeScore >= minScore) {
        scoredItems.push(scored);
      }
    }

    // 5. Deterministic Ordering: compositeScore descending, tie-break by objectId ascending
    scoredItems.sort((a, b) => {
      if (Math.abs(b.compositeScore - a.compositeScore) > 1e-6) {
        return b.compositeScore - a.compositeScore;
      }
      return a.ref.objectId.localeCompare(b.ref.objectId);
    });

    // Assign final ranks
    const rankedItems: KnowledgeRetrievalRankedItem[] = scoredItems.map((item, idx) =>
      Object.freeze({
        ...item,
        rank: idx + 1,
      })
    );

    // 6. Pagination
    const totalMatched = rankedItems.length;
    const totalPages = Math.ceil(totalMatched / pageSize) || 1;
    const offset = (page - 1) * pageSize;
    const pagedItems = rankedItems.slice(offset, offset + pageSize);

    // 7. Deterministic Retrieval SHA-256 Digest
    const digestPayload = JSON.stringify({
      query: query.query,
      tenantId: query.tenantId,
      totalMatched,
      page,
      pageSize,
      items: pagedItems.map((it) => ({
        id: it.ref.objectId,
        score: it.compositeScore,
        cs: it.ref.checksum,
      })),
    });

    const retrievalDigest = crypto.createHash('sha256').update(digestPayload).digest('hex');

    return Object.freeze({
      query: query.query,
      tenantId: query.tenantId,
      totalMatched,
      page,
      pageSize,
      totalPages,
      items: Object.freeze(pagedItems),
      retrievalDigest,
    });
  }
}
