/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.5: Scene Graph Controller
 *
 * Manages 3D object hierarchies, parent-child links, visibility, selection,
 * and traversal independently from Reality X.
 */

import { ModelObject3D, ModelScene3D } from './types';
import { deterministicHash } from './determinism';

export class SceneGraphController {
  private selectedModelObjectId: string | null = null;

  public getSelectedId(): string | null {
    return this.selectedModelObjectId;
  }

  public select(id: string | null): void {
    this.selectedModelObjectId = id;
  }

  public getSelectedObject(scene: ModelScene3D): ModelObject3D | null {
    if (!this.selectedModelObjectId) return null;
    return scene.objects.find((o) => o.modelObjectId === this.selectedModelObjectId) || null;
  }

  public static setVisibility(scene: ModelScene3D, modelObjectId: string, visible: boolean): ModelScene3D {
    const updated = scene.objects.map((o) => (o.modelObjectId === modelObjectId ? { ...o, visible } : o));
    return this.recomputeScene(scene, updated);
  }

  public static setParent(scene: ModelScene3D, childId: string, parentId: string | null): ModelScene3D {
    const updated = scene.objects.map((o) => {
      if (o.modelObjectId === childId) {
        return { ...o, parentId };
      }
      if (o.modelObjectId === parentId && !o.childrenIds.includes(childId)) {
        return { ...o, childrenIds: [...o.childrenIds, childId] };
      }
      return o;
    });
    return this.recomputeScene(scene, updated);
  }

  private static recomputeScene(scene: ModelScene3D, objects: ModelObject3D[]): ModelScene3D {
    const modelHashContent = JSON.stringify(
      objects.map((o) => [
        o.modelObjectId,
        o.transform.position,
        o.transform.rotation,
        o.transform.scale,
        o.geometry.geometryChecksum,
        o.visible,
      ])
    );
    const modelChecksum = deterministicHash(modelHashContent);
    const sceneChecksum = deterministicHash(JSON.stringify([scene.sourceRealityChecksum, modelChecksum]));

    return Object.freeze({
      ...scene,
      objects: Object.freeze(objects),
      modelChecksum,
      sceneChecksum,
    });
  }
}
