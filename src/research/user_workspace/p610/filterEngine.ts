/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.10: Filter Engine
 *
 * Deterministic monotonic filtering of IndexRecords.
 */

import { IndexRecord, WorkspaceSearchQuery } from './types';

export class FilterEngine {
  public static filter(
    records: readonly IndexRecord[],
    query: WorkspaceSearchQuery
  ): readonly IndexRecord[] {
    return Object.freeze(
      records.filter((rec) => {
        // Entity Type filter
        if (query.entityTypes && query.entityTypes.length > 0) {
          if (!query.entityTypes.includes(rec.entityType)) {
            return false;
          }
        }

        // Space ID filter
        if (query.spaceId && rec.spaceId !== query.spaceId) {
          return false;
        }

        // Pinned filter
        if (query.isPinned !== undefined && rec.isPinned !== query.isPinned) {
          return false;
        }

        // Status filter
        if (query.status && rec.status !== query.status) {
          return false;
        }

        // Schema filter
        if (query.schemaVersion && rec.schemaVersion !== query.schemaVersion) {
          return false;
        }

        // Dimension filter
        if (query.dimensionType && rec.dimensionType !== query.dimensionType) {
          return false;
        }

        // Certainty filter
        if (query.certainty && rec.certainty !== query.certainty) {
          return false;
        }

        // Tags filter
        if (query.tags && query.tags.length > 0) {
          const hasAllTags = query.tags.every((t) =>
            rec.tags.map((x) => x.toLowerCase()).includes(t.toLowerCase())
          );
          if (!hasAllTags) {
            return false;
          }
        }

        return true;
      })
    );
  }
}
