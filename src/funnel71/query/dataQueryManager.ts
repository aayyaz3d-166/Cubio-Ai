/**
 * 3D Memory Studio — Funnel 71
 * Data Query Manager
 */

import { StudioRecord, DataQueryCriteria } from '../types';
import { DataFilterManager } from './dataFilterManager';
import { DataSortManager } from './dataSortManager';

export class DataQueryManager {
  private readonly filterManager: DataFilterManager;
  private readonly sortManager: DataSortManager;

  constructor(filterManager?: DataFilterManager, sortManager?: DataSortManager) {
    this.filterManager = filterManager ?? new DataFilterManager();
    this.sortManager = sortManager ?? new DataSortManager();
  }

  public executeQuery(
    records: readonly StudioRecord[],
    criteria: DataQueryCriteria
  ): readonly StudioRecord[] {
    let filtered = this.filterManager.filterRecords(records, criteria);
    let sorted = this.sortManager.sortRecords(
      filtered,
      criteria.sortBy ?? 'id',
      criteria.sortDirection ?? 'ASC'
    );

    const offset = criteria.offset ?? 0;
    if (offset > 0) {
      sorted = sorted.slice(offset);
    }

    const limit = criteria.limit;
    if (limit !== undefined && limit >= 0) {
      sorted = sorted.slice(0, limit);
    }

    return sorted;
  }
}
