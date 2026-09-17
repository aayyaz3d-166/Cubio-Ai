/**
 * 3D Memory Studio — Funnel 68
 * Coordinate View Manager
 */

import { CoordinateSelectionManager } from './coordinateSelectionManager';
import { CoordinateViewState } from '../types';
import { SimulationDimension } from '../../funnel52/types';
import { DataClassification } from '../../funnel47/types';

export class CoordinateViewManager {
  public readonly selectionManager: CoordinateSelectionManager;

  constructor() {
    this.selectionManager = new CoordinateSelectionManager();
  }

  public updateSelectedCoordinate(
    id: string,
    coords: readonly [number, number, number],
    classification: DataClassification = 'GREEN',
    dim: SimulationDimension = 3
  ): boolean {
    return this.selectionManager.setSelectedState(id, coords, classification, dim);
  }

  public getSnapshot(): CoordinateViewState {
    return this.selectionManager.getViewState();
  }

  public reset(): void {
    this.selectionManager.clear();
  }
}
