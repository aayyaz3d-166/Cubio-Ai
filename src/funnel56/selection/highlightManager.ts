/**
 * 3D Memory Studio — Funnel 56
 * Search Highlight Manager
 */

import { SceneRegistry } from '../scene/sceneRegistry';
import { StateSceneObject } from '../objects/stateSceneObject';

export class HighlightManager {
  private highlightedIds: Set<string> = new Set();
  private registry: SceneRegistry;

  constructor(registry: SceneRegistry) {
    this.registry = registry;
  }

  public highlightSearchMatches(query: string): number {
    this.clearHighlights();
    const cleanQuery = query.trim().toLowerCase();
    if (!cleanQuery) return 0;

    const stateObjects = this.registry.getByType('STATE') as StateSceneObject[];
    let matchCount = 0;

    for (const obj of stateObjects) {
      const match =
        obj.stateId.toLowerCase().includes(cleanQuery) ||
        obj.recordId.toLowerCase().includes(cleanQuery) ||
        obj.category.toLowerCase().includes(cleanQuery) ||
        (obj.sourceState?.entityName && obj.sourceState.entityName.toLowerCase().includes(cleanQuery));

      if (match) {
        obj.isHighlighted = true;
        this.highlightedIds.add(obj.id);
        matchCount++;
      }
    }

    return matchCount;
  }

  public clearHighlights(): void {
    for (const id of this.highlightedIds) {
      const obj = this.registry.get(id);
      if (obj && obj instanceof StateSceneObject) {
        obj.isHighlighted = false;
      }
    }
    this.highlightedIds.clear();
  }

  public get highlightedCount(): number {
    return this.highlightedIds.size;
  }
}
