/**
 * 3D Memory Studio — Funnel 76
 * Scene Boot Adapter (F56 Integration)
 */

import { SceneEngine } from '../../funnel56/scene/sceneEngine';

export class SceneBootAdapter {
  public async checkReadiness(scene?: SceneEngine): Promise<{ ready: boolean; error?: string }> {
    try {
      const activeScene = scene ?? new SceneEngine();
      activeScene.initialize();
      const count = activeScene.registry.getAll().length;
      return { ready: count >= 0 };
    } catch (err: any) {
      return { ready: false, error: err?.message || 'Scene check failed' };
    }
  }
}
