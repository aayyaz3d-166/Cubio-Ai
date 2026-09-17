/**
 * 3D Memory Studio — Funnel 56
 * Scene Selection Manager
 */

import { ISceneObject } from '../types';
import { StateSceneObject } from '../objects/stateSceneObject';
import { SceneRegistry } from '../scene/sceneRegistry';

export class SceneSelectionManager {
  private selectedObjectId: string | null = null;
  private registry: SceneRegistry;

  constructor(registry: SceneRegistry) {
    this.registry = registry;
  }

  public selectObject(id: string | null): ISceneObject | null {
    // Clear previous selection
    if (this.selectedObjectId) {
      const prev = this.registry.get(this.selectedObjectId);
      if (prev && prev instanceof StateSceneObject) {
        prev.isSelected = false;
      }
    }

    this.selectedObjectId = id;

    if (id) {
      const current = this.registry.get(id);
      if (current && current instanceof StateSceneObject) {
        current.isSelected = true;
        return current;
      }
    }

    return null;
  }

  public clearSelection(): void {
    this.selectObject(null);
  }

  public getSelectedObjectId(): string | null {
    return this.selectedObjectId;
  }

  public getSelectedObject(): ISceneObject | null {
    return this.selectedObjectId ? this.registry.get(this.selectedObjectId) || null : null;
  }
}
