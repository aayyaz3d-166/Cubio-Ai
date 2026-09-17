/**
 * 3D Memory Studio — Funnel 60
 * Graph Engine ↔ Dimension Synchronizer Adapter
 */

import { GraphRegistry } from '../../funnel58/graph/graphRegistry';
import { DimensionCoordinate } from '../types';

export function applyProjectionsToGraph(
  projections: readonly DimensionCoordinate[],
  graphRegistry: GraphRegistry
): void {
  const coordMap = new Map<string, [number, number, number]>();
  for (const c of projections) {
    coordMap.set(c.stateId, [...c.projectedPosition]);
  }

  for (const rel of graphRegistry.getAll()) {
    const srcPos = coordMap.get(rel.sourceStateId);
    const tgtPos = coordMap.get(rel.targetStateId);

    if (srcPos) rel.sourcePos = [...srcPos];
    if (tgtPos) rel.targetPos = [...tgtPos];
  }
}
