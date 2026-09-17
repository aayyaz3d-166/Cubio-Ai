/**
 * 3D Memory Studio — Funnel 60
 * Dimension Registry
 *
 * Authoritative registry of supported multi-dimensional spaces (Z1, Z2, Z3, Z4, Z8, Z12, Z16).
 */

import { DimensionId, DimensionDescriptor } from '../types';
import { SimulationDimension } from '../../funnel52/types';

export class DimensionRegistry {
  private dimensions: Map<DimensionId, DimensionDescriptor> = new Map();

  constructor() {
    this.registerStandardDimensions();
  }

  private registerStandardDimensions(): void {
    const standard: DimensionDescriptor[] = [
      {
        dimensionId: 'Z1',
        dimensionNumber: 1,
        label: '1D Linear Projection',
        axisCount: 1,
        coordinateModel: 'Single Linear Axis (X)',
        defaultProjection: 'ORTHOGRAPHIC',
        isPhysicalSpatial: false,
        isComputationalProjection: true,
        description: 'Single-axis computational projection.',
        enabled: true,
        visible: true,
        order: 1,
      },
      {
        dimensionId: 'Z2',
        dimensionNumber: 2,
        label: '2D Planar Projection',
        axisCount: 2,
        coordinateModel: 'Planar Surface (X, Y)',
        defaultProjection: 'ORTHOGRAPHIC',
        isPhysicalSpatial: false,
        isComputationalProjection: true,
        description: 'Two-axis planar computational projection.',
        enabled: true,
        visible: true,
        order: 2,
      },
      {
        dimensionId: 'Z3',
        dimensionNumber: 3,
        label: '3D Actual Spatial Mode',
        axisCount: 3,
        coordinateModel: 'Euclidean Spatial (X, Y, Z)',
        defaultProjection: 'DIRECT',
        isPhysicalSpatial: true,
        isComputationalProjection: false,
        description: 'Primary actual 3D spatial renderer mode.',
        enabled: true,
        visible: true,
        order: 3,
      },
      {
        dimensionId: 'Z4',
        dimensionNumber: 4,
        label: '4D Hyper-Spatial Projection',
        axisCount: 4,
        coordinateModel: '4D Simplex Lattice (X, Y, Z, A4)',
        defaultProjection: 'RADIAL',
        isPhysicalSpatial: false,
        isComputationalProjection: true,
        description: '4-axis mathematical projection into 3D GPU space.',
        enabled: true,
        visible: true,
        order: 4,
      },
      {
        dimensionId: 'Z8',
        dimensionNumber: 8,
        label: '8D Octahedral Projection',
        axisCount: 8,
        coordinateModel: '8D E8 Lie Subspace (X, Y, Z, A4..A8)',
        defaultProjection: 'PAIRWISE',
        isPhysicalSpatial: false,
        isComputationalProjection: true,
        description: '8-axis mathematical projection into 3D GPU space.',
        enabled: true,
        visible: true,
        order: 8,
      },
      {
        dimensionId: 'Z12',
        dimensionNumber: 12,
        label: '12D Dodecahedral Projection',
        axisCount: 12,
        coordinateModel: '12D Modular Lattice (X, Y, Z, A4..A12)',
        defaultProjection: 'LAYER',
        isPhysicalSpatial: false,
        isComputationalProjection: true,
        description: '12-axis mathematical projection into 3D GPU space.',
        enabled: true,
        visible: true,
        order: 12,
      },
      {
        dimensionId: 'Z16',
        dimensionNumber: 16,
        label: '16D Sedenion Projection',
        axisCount: 16,
        coordinateModel: '16D Sedenion Algebra (X, Y, Z, A4..A16)',
        defaultProjection: 'RADIAL',
        isPhysicalSpatial: false,
        isComputationalProjection: true,
        description: '16-axis mathematical projection into 3D GPU space.',
        enabled: true,
        visible: true,
        order: 16,
      },
    ];

    for (const d of standard) {
      this.dimensions.set(d.dimensionId, d);
    }
  }

  public register(desc: DimensionDescriptor): boolean {
    if (this.dimensions.has(desc.dimensionId)) {
      return false; // Duplicate rejection
    }
    this.dimensions.set(desc.dimensionId, desc);
    return true;
  }

  public get(id: DimensionId): DimensionDescriptor | undefined {
    return this.dimensions.get(id);
  }

  public getByNumber(num: SimulationDimension): DimensionDescriptor | undefined {
    const id = `Z${num}` as DimensionId;
    return this.dimensions.get(id);
  }

  public has(id: DimensionId): boolean {
    return this.dimensions.has(id);
  }

  public getAll(): readonly DimensionDescriptor[] {
    return Array.from(this.dimensions.values()).sort((a, b) => a.order - b.order);
  }

  public get count(): number {
    return this.dimensions.size;
  }

  public clear(): void {
    this.dimensions.clear();
  }
}
