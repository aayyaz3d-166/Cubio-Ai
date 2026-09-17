/**
 * 3D Memory Studio — Funnel 57
 * Master Material Engine
 */

import { MaterialRegistry } from './materialRegistry';
import { MaterialFactory } from './materialFactory';

export class MaterialEngine {
  public readonly registry: MaterialRegistry;
  public readonly factory: MaterialFactory;
  private isDisposed = false;

  constructor() {
    this.registry = new MaterialRegistry();
    this.factory = new MaterialFactory(this.registry);
  }

  public initialize(): void {
    if (this.isDisposed) throw new Error('Cannot initialize disposed MaterialEngine.');
  }

  public getStats() {
    return {
      totalMaterials: this.registry.count,
    };
  }

  public dispose(): void {
    if (this.isDisposed) return;
    this.isDisposed = true;
    this.registry.disposeAll();
  }
}
