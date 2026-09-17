/**
 * 3D Memory Studio — Funnel 45
 * Deterministic Selectors & Filtering Engine
 *
 * Provides pure, deterministic selection, filtering, and bounded windowing
 * for Studio datasets without mutating underlying records.
 */

import { NormalizedStudioDataset, NormalizedStudioRecord } from './adapters';
import { StudioFilterCriteria, StudioRenderBudget } from './types';

export function createDefaultRenderBudget(): StudioRenderBudget {
  return Object.freeze({
    maxVisibleStates: 50,
    maxVisibleNodes: 30,
    maxVisibleEdges: 60,
    maxVisibleSequenceSymbols: 120,
    maxGraphDepth: 3,
    maxDimensionDisplayAxes: 8,
  });
}

export function createDefaultFilterCriteria(): StudioFilterCriteria {
  return Object.freeze({
    pageIndex: 0,
    pageSize: 20,
  });
}

/**
 * Filter records deterministically based on filter criteria
 */
export function filterStudioRecords(
  dataset: NormalizedStudioDataset,
  filters: StudioFilterCriteria
): readonly NormalizedStudioRecord[] {
  let matched = dataset.records;

  if (filters.universeId) {
    matched = matched.filter((r) => r.universeId === filters.universeId);
  }
  if (filters.dimension !== undefined) {
    matched = matched.filter((r) => r.dimension === filters.dimension);
  }
  if (filters.sourceDomain) {
    matched = matched.filter((r) => r.sourceDomain.toLowerCase().includes(filters.sourceDomain!.toLowerCase()));
  }
  if (filters.category) {
    matched = matched.filter((r) => r.category.toLowerCase() === filters.category!.toLowerCase());
  }
  if (filters.recordIdPattern) {
    const pat = filters.recordIdPattern.toLowerCase();
    matched = matched.filter((r) => r.recordId.toLowerCase().includes(pat));
  }
  if (filters.checksumPattern) {
    const pat = filters.checksumPattern.toLowerCase();
    matched = matched.filter((r) => r.payloadChecksum.toLowerCase().includes(pat));
  }
  if (filters.sequence369Prefix) {
    matched = matched.filter((r) => r.sequence369.startsWith(filters.sequence369Prefix!));
  }
  if (filters.coordinatePattern) {
    matched = matched.filter((r) => r.formattedCoordinate.includes(filters.coordinatePattern!));
  }

  return Object.freeze([...matched].sort((a, b) => a.stateId.localeCompare(b.stateId)));
}

/**
 * Slice a bounded window of records according to pagination and render budget
 */
export function selectBoundedRecordWindow(
  records: readonly NormalizedStudioRecord[],
  pageIndex: number,
  pageSize: number,
  renderBudget: StudioRenderBudget
): {
  totalMatching: number;
  visibleRecords: readonly NormalizedStudioRecord[];
  totalPages: number;
  hasMoreUnrendered: boolean;
} {
  const totalMatching = records.length;
  const effectivePageSize = Math.min(pageSize, renderBudget.maxVisibleStates);
  const totalPages = Math.max(1, Math.ceil(totalMatching / effectivePageSize));
  const validPageIndex = Math.max(0, Math.min(pageIndex, totalPages - 1));

  const startIdx = validPageIndex * effectivePageSize;
  const endIdx = Math.min(startIdx + effectivePageSize, totalMatching);
  const visible = records.slice(startIdx, endIdx);

  const hasMoreUnrendered = totalMatching > visible.length;

  return {
    totalMatching,
    visibleRecords: Object.freeze(visible),
    totalPages,
    hasMoreUnrendered,
  };
}
