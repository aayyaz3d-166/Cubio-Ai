/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.14: Deterministic Workspace Search Engine
 *
 * Coordinates access filtering, scope filtering, search matching,
 * ranking, sorting, and pagination.
 *
 * Invariant: Search operations are purely observational and NEVER mutate
 * Reality, Model, Geometry, Space, Experiment, or Version state.
 */

import {
  WorkspaceIndex,
  SearchQuery,
  SearchResults,
  SearchResult,
  IndexedEntity,
  EntityType,
} from './types';
import { AccessFilter } from './accessFilter';
import { SearchRankingEngine } from './searchRanking';
import { deterministicHash, generateDeterministicQuerySignature } from './determinism';

export class WorkspaceSearchEngine {
  /**
   * Execute a deterministic search on a WorkspaceIndex.
   */
  public static executeSearch(
    index: WorkspaceIndex,
    query: SearchQuery
  ): SearchResults {
    const t0 = 0; // Deterministic virtual timestamp

    // 1. Access-aware filtering
    const accessibleEntities = AccessFilter.filterEntities(
      index.entities,
      query.accessContext
    );

    // 2. Scope filtering
    const scopedEntities = WorkspaceSearchEngine.applyScopeFilter(
      accessibleEntities,
      query.scope
    );

    // 3. Explicit search filters
    const filteredEntities = WorkspaceSearchEngine.applyCriteriaFilters(
      scopedEntities,
      query.filter
    );

    // 4. Text matching & ranking
    const matches: SearchResult[] = [];
    for (const entity of filteredEntities) {
      const match = SearchRankingEngine.evaluateMatch(
        entity,
        query.text,
        query.querySignature
      );
      if (match) {
        matches.push(match);
      }
    }

    // 5. Deterministic sorting
    const sortField = query.sort?.field ?? 'RELEVANCE';
    const sortOrder = query.sort?.order ?? 'DESC';
    const sorted = SearchRankingEngine.sortResults(matches, sortField, sortOrder);

    // 6. Pagination
    const totalMatches = sorted.length;
    const offset = query.pagination?.offset ?? 0;
    const limit = query.pagination?.limit ?? 50;
    const paginated = sorted.slice(offset, offset + limit);

    // 7. Deterministic search checksum
    const rawSearchPayload = JSON.stringify([
      query.querySignature,
      totalMatches,
      offset,
      limit,
      paginated.map((r) => [r.resultId, r.entity.entityId, r.score, r.matchType]),
    ]);
    const searchChecksum = deterministicHash(rawSearchPayload);

    return Object.freeze({
      querySignature: query.querySignature,
      totalMatches,
      offset,
      limit,
      results: Object.freeze(paginated),
      searchChecksum,
      searchDurationMs: 0,
    });
  }

  /**
   * Convenience factory to build a SearchQuery.
   */
  public static createQuery(params: {
    text?: string;
    scope?: SearchQuery['scope'];
    filter?: SearchQuery['filter'];
    sort?: SearchQuery['sort'];
    pagination?: SearchQuery['pagination'];
    accessContext: SearchQuery['accessContext'];
  }): SearchQuery {
    const text = params.text ?? '';
    const scope = params.scope ?? 'ALL';
    const offset = params.pagination?.offset ?? 0;
    const limit = params.pagination?.limit ?? 50;

    const querySignature = generateDeterministicQuerySignature(
      text,
      scope,
      params.filter,
      params.sort,
      offset,
      limit
    );

    const queryId = `QRY_P614_${deterministicHash(`${params.accessContext.userId}_${querySignature}`)}`;

    return Object.freeze({
      queryId,
      text,
      scope,
      filter: params.filter ? Object.freeze({ ...params.filter }) : undefined,
      sort: params.sort ? Object.freeze({ ...params.sort }) : undefined,
      pagination: params.pagination ? Object.freeze({ ...params.pagination }) : undefined,
      accessContext: Object.freeze({ ...params.accessContext }),
      querySignature,
    });
  }

  private static applyScopeFilter(
    entities: readonly IndexedEntity[],
    scope: SearchQuery['scope']
  ): readonly IndexedEntity[] {
    if (scope === 'ALL') return entities;

    const scopeMap: Record<SearchQuery['scope'], EntityType[]> = {
      ALL: [],
      SPACES: ['SPACE'],
      EXPERIMENTS: ['EXPERIMENT'],
      STATES: ['SAVED_STATE', 'VERSION', 'TIMELINE_EVENT'],
      GEOMETRY: ['GEOMETRY_OBJECT', 'CURVE', 'SURFACE', 'SOLID', 'MESH'],
      MODELS: ['MODEL_OBJECT'],
    };

    const allowedTypes = scopeMap[scope];
    return entities.filter((e) => allowedTypes.includes(e.entityType));
  }

  private static applyCriteriaFilters(
    entities: readonly IndexedEntity[],
    filter?: SearchQuery['filter']
  ): readonly IndexedEntity[] {
    if (!filter) return entities;

    return entities.filter((e) => {
      // Entity type filter
      if (filter.entityTypes && filter.entityTypes.length > 0) {
        if (!filter.entityTypes.includes(e.entityType)) return false;
      }
      // Space filter
      if (filter.spaceId && e.spaceId !== filter.spaceId) {
        return false;
      }
      // Experiment filter
      if (filter.experimentId && e.experimentId !== filter.experimentId) {
        return false;
      }
      // Version filter
      if (filter.versionId && e.versionId !== filter.versionId) {
        return false;
      }
      // State filter
      if (filter.stateId && e.stateId !== filter.stateId) {
        return false;
      }
      // Access level filter
      if (filter.accessLevel && e.accessLevel !== filter.accessLevel) {
        return false;
      }
      // Certainty filter
      if (filter.certainty && e.certainty !== filter.certainty) {
        return false;
      }
      // Timestamp filter
      if (filter.minTimestamp !== undefined && e.createdAt < filter.minTimestamp) {
        return false;
      }
      if (filter.maxTimestamp !== undefined && e.createdAt > filter.maxTimestamp) {
        return false;
      }
      // Tags filter
      if (filter.tags && filter.tags.length > 0) {
        if (!e.tags || !filter.tags.some((t) => e.tags!.includes(t))) {
          return false;
        }
      }

      return true;
    });
  }
}
