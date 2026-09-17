/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.10: Sort Engine
 *
 * Deterministic, stable sorting with guaranteed secondary tie-breaker.
 */

import { IndexRecord, SortSpec } from './types';

export class SortEngine {
  public static sort(
    records: readonly IndexRecord[],
    spec: SortSpec = { primaryField: 'NAME', direction: 'ASC' }
  ): readonly IndexRecord[] {
    const sorted = [...records].sort((a, b) => {
      const cmp = this.compareField(a, b, spec.primaryField);
      if (cmp !== 0) {
        return spec.direction === 'ASC' ? cmp : -cmp;
      }

      if (spec.secondaryField) {
        const secCmp = this.compareField(a, b, spec.secondaryField);
        if (secCmp !== 0) {
          return spec.direction === 'ASC' ? secCmp : -secCmp;
        }
      }

      // Guaranteed deterministic tiebreaker on recordId
      return a.recordId.localeCompare(b.recordId);
    });

    return Object.freeze(sorted);
  }

  private static compareField(
    a: IndexRecord,
    b: IndexRecord,
    field: SortSpec['primaryField']
  ): number {
    switch (field) {
      case 'NAME':
        return a.name.localeCompare(b.name);
      case 'CREATED_AT':
        return a.createdAt - b.createdAt;
      case 'UPDATED_AT':
        return a.updatedAt - b.updatedAt;
      case 'LAST_VIEWED_AT':
        return a.lastViewedAt - b.lastViewedAt;
      case 'CHECKSUM':
        return a.checksumRef.localeCompare(b.checksumRef);
      case 'OBJECT_COUNT':
        return (a.objectCount || 0) - (b.objectCount || 0);
      case 'ENTITY_TYPE':
        return a.entityType.localeCompare(b.entityType);
      default:
        return 0;
    }
  }
}
