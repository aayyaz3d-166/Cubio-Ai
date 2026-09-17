/**
 * 3D Memory Studio — Funnel 60
 * Scene Graph ↔ Dimension Synchronizer Adapter
 */

import { SceneEngine } from '../../funnel56/scene/sceneEngine';
import { DimensionCoordinate } from '../types';

export function applyProjectionsToScene(
  projections: readonly DimensionCoordinate[],
  sceneEngine: SceneEngine
): void {
  for (const coord of projections) {
    const obj = sceneEngine.registry.get(coord.stateId);
    if (obj) {
      obj.transform.position = [...coord.projectedPosition];
    }
  }
}
