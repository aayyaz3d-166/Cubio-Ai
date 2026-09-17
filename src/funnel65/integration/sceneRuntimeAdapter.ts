/**
 * 3D Memory Studio — Funnel 65
 * Scene Runtime Adapter
 */

import { SceneEngine } from '../../funnel56/scene/sceneEngine';

export class SceneRuntimeAdapter {
  constructor(public readonly sceneEngine?: SceneEngine) {}

  public isSceneReady(): boolean {
    return true;
  }
}
