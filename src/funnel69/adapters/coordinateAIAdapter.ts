/**
 * 3D Memory Studio — Funnel 69
 * Coordinate AI Adapter (F68 Integration)
 */

import { CoordinateViewManager } from '../../funnel68/coordinates/coordinateViewManager';
import { isPermittedInWorkspace } from '../../funnel64/adapters/securityWorkspaceAdapter';
import { DataClassification } from '../../funnel47/types';

export class CoordinateAIAdapter {
  constructor(public readonly coordinateViewManager?: CoordinateViewManager) {}

  public getCoordinatesForState(
    stateId: string,
    classification: DataClassification = 'GREEN'
  ): readonly [number, number, number] | undefined {
    if (!isPermittedInWorkspace(classification) || stateId.toUpperCase().includes('RED')) {
      return undefined;
    }

    if (this.coordinateViewManager) {
      const snap = this.coordinateViewManager.getSnapshot();
      if (snap.stateId === stateId) {
        return [snap.x, snap.y, snap.z];
      }
    }

    // Default bounded fallback if state is permitted
    return [0, 0, 0];
  }
}
