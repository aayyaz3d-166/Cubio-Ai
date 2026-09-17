/**
 * 3D Memory Studio — Funnel 60
 * Dimension Switcher Engine
 *
 * Switches active dimension and recalculates projections while strictly preserving
 * state identity, relationship identity, and cluster membership.
 */

import { SimulationDimension } from '../../funnel52/types';
import { DimensionId, ProjectionType } from '../types';
import { DimensionRegistry } from './dimensionRegistry';

export class DimensionSwitcher {
  private currentDimension: SimulationDimension = 3;
  private currentProjection: ProjectionType = 'DIRECT';
  private registry: DimensionRegistry;

  constructor(registry: DimensionRegistry) {
    this.registry = registry;
  }

  public setDimension(dim: SimulationDimension, projection?: ProjectionType): boolean {
    const desc = this.registry.getByNumber(dim);
    if (!desc || !desc.enabled) return false;

    this.currentDimension = dim;
    this.currentProjection = projection || desc.defaultProjection;
    return true;
  }

  public setProjection(proj: ProjectionType): void {
    this.currentProjection = proj;
  }

  public get dimension(): SimulationDimension {
    return this.currentDimension;
  }

  public get dimensionId(): DimensionId {
    return `Z${this.currentDimension}` as DimensionId;
  }

  public get projection(): ProjectionType {
    return this.currentProjection;
  }

  public reset(): void {
    this.currentDimension = 3;
    this.currentProjection = 'DIRECT';
  }
}
