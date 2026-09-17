/**
 * 3D Memory Studio — Funnel 60
 * Dimension Comparison Manager
 *
 * Supports comparison between up to 2 active dimension spaces.
 */

import { SimulationDimension } from '../../funnel52/types';

export class DimensionComparisonManager {
  private primaryDim: SimulationDimension = 3;
  private comparisonDim: SimulationDimension | null = null;

  public setComparison(primary: SimulationDimension, comparison: SimulationDimension | null): boolean {
    if (comparison !== null && primary === comparison) {
      this.comparisonDim = null;
      return false;
    }
    this.primaryDim = primary;
    this.comparisonDim = comparison;
    return true;
  }

  public get isComparing(): boolean {
    return this.comparisonDim !== null;
  }

  public get primary(): SimulationDimension {
    return this.primaryDim;
  }

  public get comparison(): SimulationDimension | null {
    return this.comparisonDim;
  }

  public get activeDimensions(): readonly SimulationDimension[] {
    return this.comparisonDim !== null ? [this.primaryDim, this.comparisonDim] : [this.primaryDim];
  }

  public clearComparison(): void {
    this.comparisonDim = null;
  }
}
