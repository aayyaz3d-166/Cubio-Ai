/**
 * 3D Memory Studio — Funnel 71
 * Data Sort Manager
 *
 * Deterministic multi-tier record sorting.
 * Default: ID ascending.
 */

import { StudioRecord } from '../types';

export class DataSortManager {
  public sortRecords(
    records: readonly StudioRecord[],
    field: keyof StudioRecord = 'id',
    direction: 'ASC' | 'DESC' = 'ASC'
  ): readonly StudioRecord[] {
    const list = [...records];

    list.sort((a, b) => {
      const valA = a[field];
      const valB = b[field];

      let cmp = 0;
      if (valA !== undefined && valB !== undefined) {
        if (typeof valA === 'string' && typeof valB === 'string') {
          cmp = valA.localeCompare(valB);
        } else if (typeof valA === 'number' && typeof valB === 'number') {
          cmp = valA - valB;
        } else {
          cmp = String(valA).localeCompare(String(valB));
        }
      } else if (valA !== undefined) {
        cmp = -1;
      } else if (valB !== undefined) {
        cmp = 1;
      }

      if (direction === 'DESC') cmp = -cmp;

      // Stable secondary tiebreakers: ID ascending, then updatedAt ascending
      if (cmp === 0) {
        cmp = a.id.localeCompare(b.id);
      }
      if (cmp === 0) {
        cmp = a.updatedAt - b.updatedAt;
      }

      return cmp;
    });

    return list;
  }
}
