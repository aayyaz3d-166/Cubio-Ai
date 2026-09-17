/**
 * 3D Memory Studio — Funnel 64
 * Security Workspace Adapter & F47 Gate
 *
 * Ensures RED records never enter workspace panels, search, graph, or chat context.
 */

import { DataClassification } from '../../funnel47/types';

export function isPermittedInWorkspace(classification: DataClassification): boolean {
  return classification === 'GREEN';
}

export function filterPermittedEntities<T extends { classification: DataClassification }>(
  items: readonly T[]
): T[] {
  return items.filter((item) => item.classification === 'GREEN');
}
