/**
 * 3D Memory Studio — Funnel 77
 * Scene Object Resolver
 *
 * Resolves renderables from F56 SceneEngine and F57 GeometryEngine.
 * Enforces F47 Security: strictly filters out restricted RED data.
 */

import { SceneEngine } from '../../funnel56/scene/sceneEngine';
import { ISceneObject } from '../../funnel56/types';

export class SceneObjectResolver {
  public resolveRenderables(scene: SceneEngine): readonly ISceneObject[] {
    if ((scene as any).isDisposed) {
      return [];
    }

    const all = scene.registry.getAll();
    // Enforce F47 Security: Only GREEN / permitted objects
    return all.filter((obj) => (obj as any).classification !== 'RED');
  }

  public resolveById(scene: SceneEngine, id: string): ISceneObject | undefined {
    if ((scene as any).isDisposed) {
      return undefined;
    }

    const obj = scene.registry.get(id);
    if (!obj || (obj as any).classification === 'RED') {
      return undefined; // Security blocked
    }
    return obj;
  }
}
