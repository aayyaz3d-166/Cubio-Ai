/**
 * 3D Memory Studio — Funnel 68
 * Coordinate Selection & Resolution Manager
 */

import { CoordinateViewState } from '../types';
import { SimulationDimension } from '../../funnel52/types';
import { DataClassification } from '../../funnel47/types';
import { isPermittedInWorkspace } from '../../funnel64/adapters/securityWorkspaceAdapter';
import { getDimensionModeLabel } from '../../funnel67/database/databaseModel';
import { sanitizeCoordinate } from './coordinateModel';

export class CoordinateSelectionManager {
  private selectedStateId = 'STATE_001';
  private x = 0.0;
  private y = 0.0;
  private z = 0.0;
  private dimensionId: SimulationDimension = 3;
  private classification: DataClassification = 'GREEN';
  private locked = { x: false, y: false, z: false };

  public setSelectedState(
    id: string,
    coords: readonly [number, number, number],
    classification: DataClassification = 'GREEN',
    dim: SimulationDimension = 3
  ): boolean {
    if (!isPermittedInWorkspace(classification)) {
      return false; // RED strictly blocked
    }

    this.selectedStateId = id;
    this.x = sanitizeCoordinate(coords[0]);
    this.y = sanitizeCoordinate(coords[1]);
    this.z = sanitizeCoordinate(coords[2]);
    this.classification = classification;
    this.dimensionId = dim;
    return true;
  }

  public toggleLock(axis: 'x' | 'y' | 'z'): void {
    this.locked[axis] = !this.locked[axis];
  }

  public setDimension(dim: SimulationDimension): void {
    this.dimensionId = dim;
  }

  public getViewState(): CoordinateViewState {
    const isPhysical = this.dimensionId === 3;
    return {
      stateId: this.selectedStateId,
      x: this.x,
      y: this.y,
      z: this.z,
      dimensionId: this.dimensionId,
      dimensionModeLabel: getDimensionModeLabel(this.dimensionId),
      isPhysicalSpatial: isPhysical,
      isComputationalProjection: !isPhysical,
      classification: this.classification,
      lockedAxes: { ...this.locked },
      timestamp: Date.now(),
    };
  }

  public clear(): void {
    this.selectedStateId = 'NONE';
    this.x = 0;
    this.y = 0;
    this.z = 0;
    this.locked = { x: false, y: false, z: false };
  }
}
