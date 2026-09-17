/**
 * 3D Memory Studio — Funnel 57
 * Master Geometry Engine
 */

import { GeometryRegistry } from './geometryRegistry';
import { GeometryFactory } from './geometryFactory';

export class GeometryEngine {
  public readonly registry: GeometryRegistry;
  public readonly factory: GeometryFactory;
  private isDisposed = false;

  constructor() {
    this.registry = new GeometryRegistry();
    this.factory = new GeometryFactory(this.registry);
  }

  public initialize(): void {
    if (this.isDisposed) throw new Error('Cannot initialize disposed GeometryEngine.');
  }

  public getStats() {
    return {
      totalGeometries: this.registry.count,
      totalVertices: this.registry.totalVertices,
      totalMemoryBytes: this.registry.totalMemoryBytes,
    };
  }

  public dispose(): void {
    if (this.isDisposed) return;
    this.isDisposed = true;
    this.registry.disposeAll();
  }
}
