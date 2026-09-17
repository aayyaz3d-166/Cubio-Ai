/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.10: Search Engine
 *
 * Deterministic, case-normalized, stable search over index records without mutating state.
 */

import { IndexRecord } from './types';

export class SearchEngine {
  public static search(
    records: readonly IndexRecord[],
    queryText?: string
  ): readonly IndexRecord[] {
    if (!queryText || !queryText.trim()) {
      return Object.freeze([...records]);
    }

    const q = queryText.toLowerCase().trim();

    return Object.freeze(
      records.filter((rec) => {
        const matchName = rec.name.toLowerCase().includes(q);
        const matchEntityId = rec.entityId.toLowerCase().includes(q);
        const matchSpaceId = rec.spaceId.toLowerCase().includes(q);
        const matchTags = rec.tags.some((t) => t.toLowerCase().includes(q));
        const matchLineage = rec.lineageId ? rec.lineageId.toLowerCase().includes(q) : false;
        const matchChecksum = rec.checksumRef.toLowerCase().includes(q);
        const matchSchema = rec.schemaVersion.toLowerCase().includes(q);
        const matchStatus = rec.status.toLowerCase().includes(q);

        return (
          matchName ||
          matchEntityId ||
          matchSpaceId ||
          matchTags ||
          matchLineage ||
          matchChecksum ||
          matchSchema ||
          matchStatus
        );
      })
    );
  }
}
