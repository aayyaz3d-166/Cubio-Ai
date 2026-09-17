/**
 * 3D Memory Studio — Funnel 58
 * Graph Visibility Manager
 */

import { GraphRegistry } from '../graph/graphRegistry';
import { GraphRelationshipType } from '../types';

export class GraphVisibilityManager {
  private isGraphVisible = true;
  private typeVisibility: Map<GraphRelationshipType, boolean> = new Map([
    ['SEMANTIC', true],
    ['DOMAIN', true],
    ['CATEGORY', true],
    ['SOURCE', true],
    ['SEQUENCE', true],
    ['COORDINATE', true],
  ]);

  public setGraphVisibility(visible: boolean, registry: GraphRegistry): void {
    this.isGraphVisible = visible;
    for (const rel of registry.getAll()) {
      rel.visible = visible && (this.typeVisibility.get(rel.relationshipType) ?? true);
    }
  }

  public setTypeVisibility(
    type: GraphRelationshipType,
    visible: boolean,
    registry: GraphRegistry
  ): void {
    this.typeVisibility.set(type, visible);
    if (this.isGraphVisible) {
      for (const rel of registry.getByType(type)) {
        rel.visible = visible;
      }
    }
  }

  public isTypeVisible(type: GraphRelationshipType): boolean {
    return this.typeVisibility.get(type) ?? true;
  }

  public get visible(): boolean {
    return this.isGraphVisible;
  }
}
