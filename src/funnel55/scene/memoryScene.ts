/**
 * 3D Memory Studio — Funnel 55
 * Hierarchical Memory Scene Container
 */

import { SceneLayerId, SceneLayer, RenderableObject } from '../types';
import { MemorySceneLayer } from './sceneLayer';

const STANDARD_LAYERS: Array<{ id: SceneLayerId; name: string }> = [
  { id: 'CORE_LAYER', name: 'Memory Core Layer' },
  { id: 'STATE_LAYER', name: 'Information State Layer' },
  { id: 'RELATIONSHIP_LAYER', name: 'Relational Graph Layer' },
  { id: 'CLUSTER_LAYER', name: 'Semantic Cluster Layer' },
  { id: 'DIMENSION_LAYER', name: 'Dimensional Projection Layer' },
  { id: 'EFFECTS_LAYER', name: 'Visual Effects & Particles Layer' },
  { id: 'OVERLAY_LAYER', name: 'HUD & Diagnostics Overlay Layer' },
];

export class MemoryScene {
  private layers: Map<SceneLayerId, SceneLayer> = new Map();
  private isDisposed = false;

  constructor() {
    for (const { id, name } of STANDARD_LAYERS) {
      this.layers.set(id, new MemorySceneLayer(id, name));
    }
  }

  public getLayer(id: SceneLayerId): SceneLayer {
    const layer = this.layers.get(id);
    if (!layer) {
      throw new Error(`Scene layer '${id}' does not exist.`);
    }
    return layer;
  }

  public getAllLayers(): readonly SceneLayer[] {
    return Array.from(this.layers.values());
  }

  public addObject(obj: RenderableObject): void {
    const layer = this.getLayer(obj.layerId);
    layer.addObject(obj);
  }

  public getTotalObjectCount(): number {
    let count = 0;
    for (const layer of this.layers.values()) {
      count += layer.objects.length;
    }
    return count;
  }

  public update(deltaMs: number, timeMs: number): void {
    if (this.isDisposed) return;
    for (const layer of this.layers.values()) {
      layer.update(deltaMs, timeMs);
    }
  }

  public render(context: unknown): void {
    if (this.isDisposed) return;
    for (const layer of this.layers.values()) {
      layer.render(context);
    }
  }

  public clearAll(): void {
    for (const layer of this.layers.values()) {
      layer.clear();
    }
  }

  public dispose(): void {
    if (this.isDisposed) return;
    this.isDisposed = true;
    for (const layer of this.layers.values()) {
      layer.dispose();
    }
    this.layers.clear();
  }
}
