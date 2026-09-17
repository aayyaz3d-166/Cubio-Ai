/**
 * 3D Memory Studio — Funnel 56
 * Scene Visibility Manager
 */

import { SceneLayerId, ISceneObject } from '../types';
import { LayerManager } from '../layers/layerManager';

export class SceneVisibilityManager {
  private layerManager: LayerManager;

  constructor(layerManager: LayerManager) {
    this.layerManager = layerManager;
  }

  public showLayer(layerId: SceneLayerId): void {
    this.layerManager.getLayer(layerId).visible = true;
  }

  public hideLayer(layerId: SceneLayerId): void {
    this.layerManager.getLayer(layerId).visible = false;
  }

  public toggleLayer(layerId: SceneLayerId): boolean {
    const layer = this.layerManager.getLayer(layerId);
    layer.visible = !layer.visible;
    return layer.visible;
  }

  public isLayerVisible(layerId: SceneLayerId): boolean {
    return this.layerManager.getLayer(layerId).visible;
  }

  public showObject(obj: ISceneObject): void {
    obj.visible = true;
  }

  public hideObject(obj: ISceneObject): void {
    obj.visible = false;
  }
}
