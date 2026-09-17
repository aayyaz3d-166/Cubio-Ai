/**
 * 3D Memory Studio — Funnel 48
 * LLM Model Selectors & Deterministic Search
 */

import {
  LLMModelViewModel,
  LLMFilterType,
  LLMExplorerSummary,
  LLMSearchQueryCriteria,
  LLMSearchResultItem,
  LLMSearchConsoleViewModel,
} from './types';

/**
 * Summarizes the collection of LLM models
 */
export function summarizeLLMModels(models: readonly LLMModelViewModel[]): LLMExplorerSummary {
  let green = 0;
  let red = 0;

  for (const m of models) {
    if (m.classification === 'GREEN') {
      green++;
    } else {
      red++;
    }
  }

  const total = models.length;
  return Object.freeze({
    totalLLMs: total,
    greenLLMs: green,
    redLLMs: red,
    authorizedPercentage: total > 0 ? (green / total) * 100 : 0,
    restrictedPercentage: total > 0 ? (red / total) * 100 : 0,
  });
}

/**
 * Filters LLM models based on active filter tab and optional search query
 */
export function filterLLMModels(
  models: readonly LLMModelViewModel[],
  filterType: LLMFilterType = 'ALL_LLMS',
  searchQuery?: string
): readonly LLMModelViewModel[] {
  let filtered = models;

  if (filterType === 'GREEN_LLMS') {
    filtered = filtered.filter((m) => m.classification === 'GREEN');
  } else if (filterType === 'RED_LLMS') {
    filtered = filtered.filter((m) => m.classification === 'RED');
  }

  if (searchQuery && searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    filtered = filtered.filter(
      (m) =>
        m.modelId.toLowerCase().includes(q) ||
        m.modelName.toLowerCase().includes(q) ||
        m.provider.toLowerCase().includes(q) ||
        m.sourceDomain.toLowerCase().includes(q) ||
        m.originalChecksum.toLowerCase().includes(q)
    );
  }

  return Object.freeze(filtered);
}

/**
 * Applies bounded pagination to filtered LLM models
 */
export function selectBoundedLLMWindow(
  models: readonly LLMModelViewModel[],
  pageIndex = 0,
  pageSize = 20,
  maxVisibleBudget = 50
): {
  visibleModels: readonly LLMModelViewModel[];
  totalMatching: number;
  totalPages: number;
  hasMoreUnrendered: boolean;
} {
  const totalMatching = models.length;
  const effectivePageSize = Math.min(pageSize, maxVisibleBudget);
  const totalPages = Math.max(1, Math.ceil(totalMatching / effectivePageSize));
  const validPageIndex = Math.max(0, Math.min(pageIndex, totalPages - 1));

  const start = validPageIndex * effectivePageSize;
  const end = Math.min(start + effectivePageSize, totalMatching);
  const visible = models.slice(start, end);

  return {
    visibleModels: Object.freeze(visible),
    totalMatching,
    totalPages,
    hasMoreUnrendered: totalMatching > visible.length,
  };
}

/**
 * Deterministic multi-field search and ranking for LLM models
 * Policy: EXACT MATCH -> CLASSIFICATION (GREEN first) -> MODEL ID -> CANONICAL ID
 */
export function searchLLMModels(
  models: readonly LLMModelViewModel[],
  criteria: LLMSearchQueryCriteria
): LLMSearchConsoleViewModel {
  const query = criteria.queryTerm.toLowerCase().trim();
  if (!query) {
    return Object.freeze({
      queryTerm: criteria.queryTerm,
      totalFound: 0,
      visibleResults: Object.freeze([]),
      rankingPolicy: 'EXACT_MATCH_FIRST -> GREEN_FIRST -> ALPHABETICAL_MODEL_ID',
    });
  }

  const matches: Array<{
    item: LLMModelViewModel;
    matchType: LLMSearchResultItem['matchType'];
    score: number;
  }> = [];

  for (const m of models) {
    if (criteria.classificationFilter && criteria.classificationFilter !== 'ALL') {
      if (m.classification !== criteria.classificationFilter) continue;
    }
    if (criteria.providerFilter && m.provider !== criteria.providerFilter) {
      continue;
    }

    const idLower = m.modelId.toLowerCase();
    const nameLower = m.modelName.toLowerCase();
    const provLower = m.provider.toLowerCase();
    const domainLower = m.sourceDomain.toLowerCase();
    const chkLower = m.originalChecksum.toLowerCase();

    let score = 0;
    let matchType: LLMSearchResultItem['matchType'] | undefined;

    if (idLower === query) {
      score = 1000;
      matchType = 'EXACT_MODEL_ID';
    } else if (nameLower === query) {
      score = 900;
      matchType = 'EXACT_NAME';
    } else if (chkLower === query) {
      score = 800;
      matchType = 'CHECKSUM_MATCH';
    } else if (idLower.startsWith(query)) {
      score = 700;
      matchType = 'SUBSTRING_MATCH';
    } else if (provLower.includes(query)) {
      score = 500;
      matchType = 'PROVIDER_MATCH';
    } else if (domainLower.includes(query)) {
      score = 400;
      matchType = 'DOMAIN_MATCH';
    } else if (nameLower.includes(query) || idLower.includes(query)) {
      score = 300;
      matchType = 'SUBSTRING_MATCH';
    }

    if (matchType && score > 0) {
      // Prioritize GREEN over RED slightly in score ranking
      if (m.classification === 'GREEN') score += 50;
      matches.push({ item: m, matchType, score });
    }
  }

  // Deterministic sort: Score descending -> Model ID ascending
  matches.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.item.modelId.localeCompare(b.item.modelId);
  });

  const results: LLMSearchResultItem[] = matches.slice(0, 50).map((m, idx) => ({
    rank: idx + 1,
    modelId: m.item.modelId,
    modelName: m.item.modelName,
    provider: m.item.provider,
    classification: m.item.classification,
    matchType: m.matchType,
    processingAllowed: m.item.processingAllowed,
    formattedCoordinate: m.item.formattedCoordinate,
    payloadChecksum: m.item.originalChecksum,
  }));

  return Object.freeze({
    queryTerm: criteria.queryTerm,
    totalFound: matches.length,
    visibleResults: Object.freeze(results),
    rankingPolicy: 'EXACT_MATCH_FIRST -> GREEN_FIRST -> ALPHABETICAL_MODEL_ID',
  });
}
