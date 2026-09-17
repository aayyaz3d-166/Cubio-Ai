/**
 * 3D Memory Studio — Funnel 70
 * Dimension Action Adapter (F60 Integration)
 */

import { DimensionEngine } from '../../funnel60/dimension/dimensionEngine';
import { SimulationDimension } from '../../funnel52/types';
import { getDimensionModeLabel } from '../../funnel67/database/databaseModel';
import { VALID_DIMENSIONS } from '../actions/actionTypes';

export class DimensionActionAdapter {
  private currentDimension: SimulationDimension = 3;

  constructor(public readonly dimensionEngine?: DimensionEngine) {
    if (this.dimensionEngine) {
      this.currentDimension = this.dimensionEngine.switcher.dimension;
    }
  }

  public switchDimension(dim: SimulationDimension): boolean {
    if (!VALID_DIMENSIONS.has(dim)) return false;
    this.currentDimension = dim;
    if (this.dimensionEngine) {
      return this.dimensionEngine.setDimension(dim);
    }
    return true;
  }

  public getActiveDimension(): SimulationDimension {
    if (this.dimensionEngine) {
      return this.dimensionEngine.switcher.dimension;
    }
    return this.currentDimension;
  }

  public getDimensionModeLabel(dim?: SimulationDimension): string {
    const targetDim = dim ?? this.getActiveDimension();
    return getDimensionModeLabel(targetDim);
  }

  public isPhysicalSpatial(dim?: SimulationDimension): boolean {
    const targetDim = dim ?? this.getActiveDimension();
    return targetDim === 3;
  }
}
