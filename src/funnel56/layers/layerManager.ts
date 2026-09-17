/**
 * 3D Memory Studio — Funnel 56
 * Layer Manager & Deterministic Render Order
 */

import { SceneLayerId, ISceneObject } from '../types';

export const ORDERED_LAYERS: readonly SceneLayerId[] = Object.freeze([
  'DIMENSION_LAYER',
  'RELATIONSHIP_LAYER',
  'CLUSTER_LAYER',
  'STATE_LAYER',
  'CORE_LAYER',
  'EFFECTS_LAYER',
  'OVERLAY_LAYER',
]);

export class SceneLayerRecord {
  public readonly id: SceneLayerId;
  public visible = true;
  public opacity = 1.0;
  private objects: ISceneObject[] = [];

  constructor(id: SceneLayerId) {
    this.id = id;
  }

  public get objectList(): readonly ISceneObject[] {
    return this.objects;
  }

  public addObject(obj: ISceneObject): void {
    if (!this.objects.includes(obj)) {
      this.objects.push(obj);
    }
  }

  public removeObject(objId: string): boolean {
    const idx = this.objects.findIndex((o) => o.id === objId);
    if (idx !== -1) {
      this.objects.splice(idx, 1);
      return true;
    }
    return false;
  }

  public clear(): void {
    this.objects = [];
  }

  public update(deltaMs: number, timeMs: number): void {
    if (!this.visible) return;
    for (const obj of this.objects) {
      if (obj.enabled) {
        obj.update(deltaMs, timeMs);
      }
    }
  }

  public render(context: unknown): void {
    if (!this.visible) return;
    for (const obj of this.objects) {
      if (obj.visible && obj.enabled) {
        obj.render(context);
      }
    }
  }
}

export class LayerManager {
  private layerMap: Map<SceneLayerId, SceneLayerRecord> = new Map();

  constructor() {
    for (const layerId of ORDERED_LAYERS) {
      this.layerMap.set(layerId, new SceneLayerRecord(layerId));
    }
  }

  public getLayer(layerId: SceneLayerId): SceneLayerRecord {
    const layer = this.layerMap.get(layerId);
    if (!layer) throw new Error(`Scene layer '${layerId}' not found.`);
    return layer;
  }

  public getAllLayers(): readonly SceneLayerRecord[] {
    return ORDERED_LAYERS.map((id) => this.getLayer(id));
  }

  public addObject(obj: ISceneObject): void {
    const layer = this.getLayer(obj.layerId);
    layer.addObject(obj);
  }

  public removeObject(objId: string, layerId: SceneLayerId): void {
    const layer = this.layerMap.get(layerId);
    if (layer) {
      layer.removeObject(objId);
    }
  }

  public update(deltaMs: number, timeMs: number): void {
    for (const layerId of ORDERED_LAYERS) {
      const layer = this.layerMap.get(layerId);
      if (layer) {
        layer.update(deltaMs, timeMs);
      }
    }
  }

  public render(context: unknown): void {
    for (const layerId of ORDERED_LAYERS) {
      const layer = this.layerMap.get(layerId);
      if (layer && layer.visible) {
        layer.render(context);
      }
    }
  }

  public clearAll(): void {
    for (const layer of this.layerMap.values()) {
      layer.clear();
    }
  }

  public dispose(): void {
    this.clearAll();
    this.layerMap.clear();
  }
}
