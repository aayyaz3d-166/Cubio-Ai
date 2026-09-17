/**
 * 3D Memory Studio — Funnel 64
 * Dimension Workspace Adapter
 *
 * Exposes F60 Dimension & Projection Engine synchronization.
 */

import { DimensionEngine } from '../../funnel60/dimension/dimensionEngine';
import { SimulationDimension } from '../../funnel52/types';
import { ProjectionType, DimensionCoordinate } from '../../funnel60/types';

export class DimensionWorkspaceAdapter {
  constructor(public readonly dimensionEngine: DimensionEngine) {}

  public setDimension(dim: SimulationDimension, proj?: ProjectionType): boolean {
    return this.dimensionEngine.setDimension(dim, proj);
  }

  public getCoordinate(stateId: string): DimensionCoordinate | undefined {
    return this.dimensionEngine.getCoordinate(stateId);
  }

  public get activeDimension(): SimulationDimension {
    return this.dimensionEngine.switcher.dimension;
  }

  public get projectionType(): ProjectionType {
    return this.dimensionEngine.switcher.projection;
  }
}
