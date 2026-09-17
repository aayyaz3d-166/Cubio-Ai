/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.14: Immutable Search Snapshots
 *
 * Captures deep immutable snapshots of search executions.
 * Snapshots cannot be mutated after creation.
 */

import {
  WorkspaceIndex,
  SearchQuery,
  SearchResults,
  SearchSnapshot,
} from './types';
import {
  generateDeterministicSearchSnapshotId,
  deterministicHash,
} from './determinism';

export class SearchSnapshotEngine {
  /**
   * Create an immutable snapshot of search results and context.
   */
  public static createSnapshot(
    index: WorkspaceIndex,
    query: SearchQuery,
    results: SearchResults,
    navigationTargetIdentities: readonly string[] = []
  ): SearchSnapshot {
    const snapshotId = generateDeterministicSearchSnapshotId(
      index.indexChecksum,
      query.querySignature
    );

    const snapshotRaw = JSON.stringify([
      snapshotId,
      index.indexChecksum,
      query.querySignature,
      query.accessContext,
      results.searchChecksum,
      navigationTargetIdentities,
      results.totalMatches,
    ]);
    const snapshotChecksum = deterministicHash(snapshotRaw);

    const snapshot: SearchSnapshot = Object.freeze({
      snapshotId,
      indexChecksum: index.indexChecksum,
      querySignature: query.querySignature,
      query: Object.freeze({
        ...query,
        accessContext: Object.freeze({ ...query.accessContext }),
        filter: query.filter ? Object.freeze({ ...query.filter }) : undefined,
        sort: query.sort ? Object.freeze({ ...query.sort }) : undefined,
        pagination: query.pagination ? Object.freeze({ ...query.pagination }) : undefined,
      }),
      accessContext: Object.freeze({ ...query.accessContext }),
      orderedResults: Object.freeze([...results.results]),
      navigationTargetIdentities: Object.freeze([...navigationTargetIdentities]),
      searchChecksum: results.searchChecksum,
      snapshotChecksum,
      createdAt: 0,
    });

    return snapshot;
  }
}
