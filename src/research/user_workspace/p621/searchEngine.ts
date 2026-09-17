/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.21: Deterministic Workspace Search Engine
 *
 * SEARCH IS OBSERVATION.
 * Executes deterministic search queries against authorized search index entries.
 */

import {
  SearchIndex,
  SearchQuery,
  SearchResult,
  SearchPermissionContext,
  SearchScope,
  SearchResultType,
} from './types';
import { SearchBoundaryEngine } from './searchBoundary';
import { SearchFilterEngine } from './filterEngine';
import { SearchSortEngine } from './sortEngine';
import {
  generateDeterministicQueryId,
  generateDeterministicResultId,
} from './determinism';

export class WorkspaceSearchEngine {
  public static search(
    index: SearchIndex,
    query: SearchQuery,
    context: SearchPermissionContext
  ): readonly SearchResult[] {
    // 1. Permission Boundary Filter
    const authorizedEntries = SearchBoundaryEngine.filterAuthorizedEntries(
      index.entries,
      context
    );

    if (authorizedEntries.length === 0) {
      return Object.freeze([]);
    }

    // 2. Scope Filter
    let scopedEntries = authorizedEntries;
    if (query.scope && query.scope !== 'ALL') {
      const targetType = this.mapScopeToResultType(query.scope);
      if (targetType) {
        scopedEntries = scopedEntries.filter((e) => e.sourceType === targetType);
      } else if (query.scope === 'SHARED') {
        scopedEntries = scopedEntries.filter((e) => e.accessLevel === 'SHARED');
      }
    }

    // 3. Term / Keyword Filter
    let matchedEntries = scopedEntries;
    if (query.term && query.term.trim() !== '') {
      const termLower = query.term.trim().toLowerCase();
      matchedEntries = matchedEntries.filter((e) => {
        return (
          e.sourceId.toLowerCase() === termLower ||
          e.sourceId.toLowerCase().includes(termLower) ||
          e.name.toLowerCase().includes(termLower) ||
          e.lineageId.toLowerCase().includes(termLower)
        );
      });
    }

    // 4. Custom Filters
    const filteredEntries = SearchFilterEngine.applyFilters(
      matchedEntries,
      query.filters
    );

    // 5. Sorting
    const sortedEntries = SearchSortEngine.sortEntries(
      filteredEntries,
      query.sort
    );

    // 6. Pagination
    const offset = query.offset ?? 0;
    const limit = query.limit ?? sortedEntries.length;
    const paginatedEntries = sortedEntries.slice(offset, offset + limit);

    // 7. Results Mapping
    const queryId = query.queryId ?? generateDeterministicQueryId(
      query.term ?? '',
      query.scope ?? 'ALL',
      query.filters?.length ?? 0
    );

    const results: SearchResult[] = paginatedEntries.map((e) => {
      const resultId = generateDeterministicResultId(e.sourceId, queryId);
      let score = 1.0;
      if (query.term && e.sourceId.toLowerCase() === query.term.toLowerCase()) {
        score = 2.0; // Exact ID match bonus
      } else if (query.term && e.name.toLowerCase() === query.term.toLowerCase()) {
        score = 1.5; // Exact name match bonus
      }

      return Object.freeze({
        resultId,
        sourceId: e.sourceId,
        resultType: e.sourceType,
        name: e.name,
        spaceId: e.spaceId,
        experimentId: e.experimentId,
        ownerId: e.ownerId,
        accessLevel: e.accessLevel,
        lineageId: e.lineageId,
        checksum: e.checksum,
        certainty: e.certainty,
        coordinates: e.coordinates,
        score,
        metadata: e.metadata,
      });
    });

    return Object.freeze(results);
  }

  private static mapScopeToResultType(scope: SearchScope): SearchResultType | null {
    switch (scope) {
      case 'SPACES':
        return 'SPACE';
      case 'EXPERIMENTS':
        return 'EXPERIMENT';
      case 'SAVED_STATES':
        return 'SAVED_STATE';
      case 'VERSIONS':
        return 'VERSION';
      case 'CHECKPOINTS':
        return 'CHECKPOINT';
      case 'MODELS':
        return 'MODEL';
      case 'GEOMETRIES':
        return 'GEOMETRY';
      default:
        return null;
    }
  }
}
