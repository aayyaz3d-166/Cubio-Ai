/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.25-J: Object Selection Binding Layer
 *
 * Manages object selection state.
 * Strictly guarantees: Object selection is purely a UI/view mutation and
 * NEVER alters Reality, Model, or Geometry checksums.
 */

import {
  WorkspaceBoundGeometryScene,
  WorkspaceBoundGeometryObject,
} from './types';

export class SelectionBindingLayer {
  public static selectObject(
    scene: WorkspaceBoundGeometryScene,
    objectId: string | null
  ): {
    updatedScene: WorkspaceBoundGeometryScene;
    selectedObject: WorkspaceBoundGeometryObject | null;
    isGeometryChecksumInvariant: boolean;
  } {
    let selectedObj: WorkspaceBoundGeometryObject | null = null;

    if (objectId) {
      selectedObj = scene.objects.find((o) => o.objectId === objectId) ?? null;
    }

    const updatedScene: WorkspaceBoundGeometryScene = Object.freeze({
      ...scene,
      selectedObjectId: selectedObj ? selectedObj.objectId : null,
      updatedAt: Date.now(),
    });

    const isGeometryChecksumInvariant = updatedScene.sceneChecksum === scene.sceneChecksum;

    return {
      updatedScene,
      selectedObject: selectedObj,
      isGeometryChecksumInvariant,
    };
  }
}
