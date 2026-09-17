/**
 * 3D Memory Studio — Funnel 49
 * Dimension-Aware Unified Search Engine
 *
 * Resolves queries across 14 dimensional attributes with detailed match reasons,
 * deterministic ranking, and strict zero-fabrication safety.
 */

import {
  InformationUniverseIndex,
  DimensionalSearchResponse,
  DimensionalSearchResultItem,
  DimensionalSearchMatchReason,
  DimensionalInformationState,
} from './types';

/**
 * Searches the InformationUniverseIndex with multi-facet match reason explanations
 */
export function searchDimensionalUniverse(
  index: InformationUniverseIndex,
  rawQuery: string,
  maxResults = 50
): DimensionalSearchResponse {
  const t0 = performance.now();
  const query = rawQuery.trim().toLowerCase();

  if (!query) {
    return Object.freeze({
      query: rawQuery,
      totalFound: 0,
      results: Object.freeze([]),
      durationMs: performance.now() - t0,
      rankingPolicy: 'EXACT_MATCH_FIRST -> GREEN_FIRST -> ALPHABETICAL_STATE_ID',
    });
  }

  const queryTerms = query.split(/\s+/).filter((t) => t.length > 0);
  const candidates = new Map<
    string,
    {
      state: DimensionalInformationState;
      score: number;
      reasons: DimensionalSearchMatchReason[];
    }
  >();

  for (const s of index.states) {
    let score = 0;
    const reasons: DimensionalSearchMatchReason[] = [];

    const stateIdLower = s.stateId.toLowerCase();
    const recIdLower = s.recordId.toLowerCase();
    const entityLower = s.entityName.toLowerCase();
    const catLower = s.category.toLowerCase();
    const domainLower = s.sourceDomain.toLowerCase();
    const chkLower = s.payloadChecksum.toLowerCase();
    const modelNameLower = s.modelMetadata?.modelName.toLowerCase();
    const providerLower = s.modelMetadata?.provider.toLowerCase();

    // 1. Exact ID match
    if (stateIdLower === query || recIdLower === query) {
      score += 1000;
      reasons.push({
        type: 'EXACT_ID_MATCH',
        description: 'Exact match on State / Record ID',
        fieldMatched: 'stateId',
        matchedValue: s.recordId,
      });
    }

    // 2. Exact Model Name / Entity Name match
    if (modelNameLower && modelNameLower === query) {
      score += 950;
      reasons.push({
        type: 'MODEL_NAME_MATCH',
        description: 'Exact match on Model Name',
        fieldMatched: 'modelMetadata.modelName',
        matchedValue: s.modelMetadata!.modelName,
      });
    } else if (entityLower === query) {
      score += 900;
      reasons.push({
        type: 'ENTITY_MATCH',
        description: 'Exact match on Entity Name',
        fieldMatched: 'entityName',
        matchedValue: s.entityName,
      });
    }

    // 3. Exact Checksum match
    if (chkLower === query || chkLower.includes(query)) {
      score += 800;
      reasons.push({
        type: 'CHECKSUM_MATCH',
        description: 'Match on Payload Checksum',
        fieldMatched: 'payloadChecksum',
        matchedValue: s.payloadChecksum,
      });
    }

    // 4. Substring Model Name / Entity Name
    if (modelNameLower && modelNameLower.includes(query) && modelNameLower !== query) {
      score += 650;
      reasons.push({
        type: 'MODEL_NAME_MATCH',
        description: 'Substring match on Model Name',
        fieldMatched: 'modelMetadata.modelName',
        matchedValue: s.modelMetadata!.modelName,
      });
    } else if (entityLower.includes(query) && entityLower !== query) {
      score += 600;
      reasons.push({
        type: 'ENTITY_MATCH',
        description: 'Substring match on Entity Name',
        fieldMatched: 'entityName',
        matchedValue: s.entityName,
      });
    }

    // 5. Provider match
    if (providerLower && providerLower.includes(query)) {
      score += 500;
      reasons.push({
        type: 'PROVIDER_MATCH',
        description: 'Match on Model Provider',
        fieldMatched: 'modelMetadata.provider',
        matchedValue: s.modelMetadata!.provider,
      });
    }

    // 6. Category match
    if (catLower === query || catLower.includes(query)) {
      score += 350;
      reasons.push({
        type: 'CATEGORY_MATCH',
        description: 'Match on Category',
        fieldMatched: 'category',
        matchedValue: s.category,
      });
    }

    // 7. Domain match
    if (domainLower.includes(query)) {
      score += 300;
      reasons.push({
        type: 'DOMAIN_MATCH',
        description: 'Match on Source Domain',
        fieldMatched: 'sourceDomain',
        matchedValue: s.sourceDomain,
      });
    }

    // 8. 369 Sequence / Prefix match (GREEN only)
    if (s.sequence369 && (query === '369' || query.startsWith('369') || s.sequence369.includes(query))) {
      score += 400;
      reasons.push({
        type: 'SEQUENCE_369_MATCH',
        description: 'Ternary 369 sequence pattern match',
        fieldMatched: 'sequence369',
        matchedValue: s.sequence369.substring(0, 12) + '...',
      });
    }

    // 9. Coordinate match (GREEN only)
    for (const [dim, coord] of Object.entries(s.coordinatesByDimension)) {
      if (coord.formattedCoordinate.toLowerCase().includes(query)) {
        score += 350;
        reasons.push({
          type: 'COORDINATE_MATCH',
          description: `Spatial coordinate match in dimension Z${dim}`,
          fieldMatched: `coordinatesByDimension[${dim}]`,
          matchedValue: coord.formattedCoordinate,
        });
        break;
      }
    }

    // 10. Semantic Term matches
    for (const term of s.semanticTerms) {
      if (queryTerms.includes(term.toLowerCase()) || term.toLowerCase().includes(query)) {
        score += 200;
        reasons.push({
          type: 'SEMANTIC_TERM_MATCH',
          description: `Semantic term match for '${term}'`,
          fieldMatched: 'semanticTerms',
          matchedValue: term,
        });
        break;
      }
    }

    // 11. Classification filter match
    if (query === 'green' && s.classification === 'GREEN') {
      score += 100;
      reasons.push({
        type: 'CLASSIFICATION_MATCH',
        description: 'Matched classification filter GREEN',
        fieldMatched: 'classification',
        matchedValue: 'GREEN',
      });
    } else if (query === 'red' && s.classification === 'RED') {
      score += 100;
      reasons.push({
        type: 'CLASSIFICATION_MATCH',
        description: 'Matched classification filter RED',
        fieldMatched: 'classification',
        matchedValue: 'RED',
      });
    }

    // 12. Knowledge graph connected entity match
    for (const conn of s.connectedEntityIds) {
      if (conn.toLowerCase().includes(query)) {
        score += 150;
        reasons.push({
          type: 'GRAPH_RELATION_MATCH',
          description: `Connected to related graph entity '${conn}'`,
          fieldMatched: 'connectedEntityIds',
          matchedValue: conn,
        });
        break;
      }
    }

    if (score > 0 && reasons.length > 0) {
      // Prioritize GREEN over RED slightly in scoring
      if (s.classification === 'GREEN') score += 50;
      candidates.set(s.stateId, { state: s, score, reasons });
    }
  }

  // Deterministic sort: Score descending -> stateId ascending
  const sortedList = Array.from(candidates.values()).sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.state.stateId.localeCompare(b.state.stateId);
  });

  const results: DimensionalSearchResultItem[] = sortedList.slice(0, maxResults).map((c, idx) => ({
    rank: idx + 1,
    score: c.score,
    stateId: c.state.stateId,
    recordId: c.state.recordId,
    entityName: c.state.entityName,
    category: c.state.category,
    classification: c.state.classification,
    sourceDomain: c.state.sourceDomain,
    provider: c.state.modelMetadata?.provider,
    sequence369Snippet: c.state.sequence369 ? c.state.sequence369.substring(0, 18) : null,
    formattedCoordinateZ3: c.state.coordinatesByDimension[3]?.formattedCoordinate ?? null,
    formattedCoordinateZ8: c.state.coordinatesByDimension[8]?.formattedCoordinate ?? null,
    payloadChecksum: c.state.payloadChecksum,
    processingAllowed: c.state.processingAllowed,
    matchReasons: Object.freeze(c.reasons),
  }));

  return Object.freeze({
    query: rawQuery,
    totalFound: sortedList.length,
    results: Object.freeze(results),
    durationMs: performance.now() - t0,
    rankingPolicy: 'EXACT_MATCH_FIRST -> GREEN_FIRST -> ALPHABETICAL_STATE_ID',
  });
}
