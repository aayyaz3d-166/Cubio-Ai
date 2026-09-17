/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.21: Deterministic Search Filter Engine
 *
 * Evaluates atomic and compound (AND / OR) filter trees against index entries.
 */

import { SearchIndexEntry, SearchFilter } from './types';

export class SearchFilterEngine {
  public static matchesFilter(entry: SearchIndexEntry, filter: SearchFilter): boolean {
    if (filter.operator === 'AND') {
      if (!filter.andConditions || filter.andConditions.length === 0) return true;
      return filter.andConditions.every((sub) => this.matchesFilter(entry, sub));
    }

    if (filter.operator === 'OR') {
      if (!filter.orConditions || filter.orConditions.length === 0) return true;
      return filter.orConditions.some((sub) => this.matchesFilter(entry, sub));
    }

    const fieldValue = this.getFieldValue(entry, filter.field);
    if (fieldValue === undefined || fieldValue === null) {
      return false;
    }

    switch (filter.operator) {
      case 'EQUALS':
      case 'EXACT':
        return String(fieldValue).toLowerCase() === String(filter.value).toLowerCase();

      case 'CONTAINS':
        return String(fieldValue).toLowerCase().includes(String(filter.value).toLowerCase());

      case 'IN':
        if (Array.isArray(filter.value)) {
          return filter.value.some((v) => String(v).toLowerCase() === String(fieldValue).toLowerCase());
        }
        return String(fieldValue).toLowerCase() === String(filter.value).toLowerCase();

      default:
        return false;
    }
  }

  public static applyFilters(
    entries: readonly SearchIndexEntry[],
    filters?: readonly SearchFilter[]
  ): readonly SearchIndexEntry[] {
    if (!filters || filters.length === 0) {
      return entries;
    }

    return Object.freeze(
      entries.filter((entry) => filters.every((filter) => this.matchesFilter(entry, filter)))
    );
  }

  private static getFieldValue(entry: SearchIndexEntry, field: string): unknown {
    switch (field) {
      case 'id':
      case 'sourceId':
        return entry.sourceId;
      case 'type':
      case 'sourceType':
        return entry.sourceType;
      case 'name':
        return entry.name;
      case 'spaceId':
        return entry.spaceId;
      case 'experimentId':
        return entry.experimentId;
      case 'ownerId':
        return entry.ownerId;
      case 'accessLevel':
        return entry.accessLevel;
      case 'lineageId':
      case 'lineage':
        return entry.lineageId;
      case 'checksum':
        return entry.checksum;
      case 'certainty':
        return entry.certainty;
      default:
        return (entry.metadata as any)?.[field];
    }
  }
}
