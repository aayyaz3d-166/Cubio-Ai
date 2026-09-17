/**
 * 3D Memory Studio — Funnel 77
 * Scene Activation Manager
 *
 * Coordinates SceneEngine -> MemoryRendererHost pipeline.
 * Zero duplicate RAF loops.
 */

import { SceneEngine } from '../../funnel56/scene/sceneEngine';
import { MemoryRendererHost } from '../../funnel55/renderer/rendererHost';
import { SceneObjectResolver } from './sceneObjectResolver';

export class SceneActivationManager {
  public readonly resolver = new SceneObjectResolver();
  private attachedScene: SceneEngine | null = null;
  private attachedHost: MemoryRendererHost | null = null;

  public activateScene(scene: SceneEngine, host: MemoryRendererHost): boolean {
    if ((scene as any).isDisposed || (host as any).isDisposed) {
      return false;
    }

    try {
      scene.attachRenderer(host);
      if (typeof (host as any).setAttachedScene === 'function') {
        (host as any).setAttachedScene(scene);
      }
      this.attachedScene = scene;
      this.attachedHost = host;
      return true;
    } catch {
      return false;
    }
  }

  public deactivateScene(): void {
    if (this.attachedHost && typeof (this.attachedHost as any).setAttachedScene === 'function') {
      (this.attachedHost as any).setAttachedScene(null);
    }
    this.attachedScene = null;
    this.attachedHost = null;
  }

  public isSceneActivated(): boolean {
    return this.attachedScene !== null && this.attachedHost !== null;
  }

  public getAttachedScene(): SceneEngine | null {
    return this.attachedScene;
  }
}
