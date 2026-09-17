/**
 * 3D Memory Studio — Funnel 69
 * Dimension AI Adapter (F60 Integration)
 */

import { DimensionEngine } from '../../funnel60/dimension/dimensionEngine';
import { SimulationDimension } from '../../funnel52/types';
import { getDimensionModeLabel } from '../../funnel67/database/databaseModel';

export class DimensionAIAdapter {
  private fallbackDimension: SimulationDimension = 3;

  constructor(public readonly dimensionEngine?: DimensionEngine) {}

  public getActiveDimension(): SimulationDimension {
    return this.dimensionEngine ? this.dimensionEngine.switcher.dimension : this.fallbackDimension;
  }

  public getDimensionLabel(dim?: SimulationDimension): string {
    const targetDim = dim ?? this.getActiveDimension();
    return getDimensionModeLabel(targetDim);
  }

  public isPhysicalSpatial(dim?: SimulationDimension): boolean {
    const targetDim = dim ?? this.getActiveDimension();
    return targetDim === 3;
  }

  public switchDimension(dim: SimulationDimension): boolean {
    this.fallbackDimension = dim;
    if (!this.dimensionEngine) return true;
    return this.dimensionEngine.setDimension(dim);
  }
}
