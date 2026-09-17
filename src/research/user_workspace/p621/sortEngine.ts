/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.21: Deterministic Search Sort Engine
 *
 * Sorts search results deterministically by name, type, ID, lineage, checksum, or createdAt.
 * Enforces deterministic tie-breaking using sourceId to guarantee σ² = 0.
 */

import { SearchIndexEntry, SearchSort } from './types';

export class SearchSortEngine {
  public static sortEntries(
    entries: readonly SearchIndexEntry[],
    sort?: SearchSort
  ): readonly SearchIndexEntry[] {
    const sorted = [...entries];

    if (!sort) {
      // Default deterministic sort by sourceType then sourceId
      return Object.freeze(
        sorted.sort((a, b) => {
          const typeCmp = a.sourceType.localeCompare(b.sourceType);
          if (typeCmp !== 0) return typeCmp;
          return a.sourceId.localeCompare(b.sourceId);
        })
      );
    }

    const direction = sort.direction === 'DESC' ? -1 : 1;

    sorted.sort((a, b) => {
      let cmp = 0;

      switch (sort.field) {
        case 'name':
          cmp = a.name.localeCompare(b.name);
          break;
        case 'type':
          cmp = a.sourceType.localeCompare(b.sourceType);
          break;
        case 'id':
          cmp = a.sourceId.localeCompare(b.sourceId);
          break;
        case 'lineage':
          cmp = a.lineageId.localeCompare(b.lineageId);
          break;
        case 'checksum':
          cmp = a.checksum.localeCompare(b.checksum);
          break;
        case 'createdAt':
          cmp = a.createdAt - b.createdAt;
          break;
        default:
          cmp = a.sourceId.localeCompare(b.sourceId);
      }

      if (cmp !== 0) {
        return cmp * direction;
      }

      // Strict Deterministic Tie-Breaking
      return a.sourceId.localeCompare(b.sourceId);
    });

    return Object.freeze(sorted);
  }
}
