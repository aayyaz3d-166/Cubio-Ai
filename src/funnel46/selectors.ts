/**
 * 3D Memory Studio — Funnel 46
 * Frontend Selectors & Memoized Derivations
 */

import { NormalizedStudioDataset, NormalizedStudioRecord } from '../funnel45/adapters';
import {
  createDefaultFilterCriteria,
  createDefaultRenderBudget,
  filterStudioRecords,
  selectBoundedRecordWindow,
} from '../funnel45/selectors';
import { StudioFilterCriteria, StudioRenderBudget } from '../funnel45/types';

export {
  createDefaultFilterCriteria,
  createDefaultRenderBudget,
  filterStudioRecords,
  selectBoundedRecordWindow,
};

export function selectRecordById(
  dataset: NormalizedStudioDataset,
  targetId?: string
): NormalizedStudioRecord | undefined {
  if (!targetId) return dataset.records[0];
  return dataset.records.find(
    (r) => r.stateId === targetId || r.recordId === targetId || r.coordinateId === targetId
  );
}

export function selectAvailableDimensions(dataset: NormalizedStudioDataset): readonly number[] {
  const dimSet = new Set<number>();
  dimSet.add(dataset.dimension);
  for (const r of dataset.records) {
    dimSet.add(r.dimension);
  }
  return Object.freeze(Array.from(dimSet).sort((a, b) => a - b));
}

export function selectAvailableCategories(dataset: NormalizedStudioDataset): readonly string[] {
  const catSet = new Set<string>();
  for (const r of dataset.records) {
    if (r.category) catSet.add(r.category);
  }
  return Object.freeze(Array.from(catSet).sort());
}

export function selectAvailableDomains(dataset: NormalizedStudioDataset): readonly string[] {
  return dataset.sourceDomains;
}
