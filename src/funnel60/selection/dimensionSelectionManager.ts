/**
 * 3D Memory Studio — Funnel 60
 * Dimension Selection Manager
 */

import { DimensionId } from '../types';
import { SimulationDimension } from '../../funnel52/types';
import { DimensionRegistry } from '../dimension/dimensionRegistry';

export class DimensionSelectionManager {
  private selectedDimension: SimulationDimension | null = null;
  private selectedAxisId: string | null = null;

  public selectDimension(dim: SimulationDimension | null): void {
    this.selectedDimension = dim;
  }

  public selectAxis(axisId: string | null): void {
    this.selectedAxisId = axisId;
  }

  public getSelectedDimension(): SimulationDimension | null {
    return this.selectedDimension;
  }

  public getSelectedAxisId(): string | null {
    return this.selectedAxisId;
  }

  public clearSelection(): void {
    this.selectedDimension = null;
    this.selectedAxisId = null;
  }
}
