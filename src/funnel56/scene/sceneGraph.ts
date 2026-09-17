/**
 * 3D Memory Studio — Funnel 56
 * Hierarchical Scene Graph Structure
 *
 * MEMORY_WORLD
 * ├── MEMORY_CORE
 * ├── INFORMATION_STATES
 * ├── RELATIONSHIPS
 * ├── CLUSTERS
 * ├── DIMENSION_SPACE
 * ├── EFFECTS
 * └── OVERLAY
 */

import { BaseSceneObject } from '../objects/sceneObject';
import { CoreSceneObject } from '../objects/coreSceneObject';
import { StateSceneObject } from '../objects/stateSceneObject';
import { RelationshipSceneObject } from '../objects/relationshipSceneObject';
import { ClusterSceneObject } from '../objects/clusterSceneObject';
import { DimensionSceneObject } from '../objects/dimensionSceneObject';
import { SceneLayerId, ISceneObject } from '../types';

class GroupContainerObject extends BaseSceneObject {
  constructor(id: string, layerId: SceneLayerId) {
    super(id, 'CONTAINER', layerId);
  }
  protected onRender(_context: unknown): void {
    // Group container renders child objects
  }
}

export class SceneGraph {
  public readonly root: ISceneObject;
  public readonly coreNode: CoreSceneObject;
  public readonly statesNode: ISceneObject;
  public readonly relationshipsNode: ISceneObject;
  public readonly clustersNode: ISceneObject;
  public readonly dimensionsNode: ISceneObject;
  public readonly effectsNode: ISceneObject;
  public readonly overlayNode: ISceneObject;

  constructor() {
    this.root = new GroupContainerObject('MEMORY_WORLD', 'CORE_LAYER');

    this.coreNode = new CoreSceneObject('MEMORY_CORE', 3);
    this.statesNode = new GroupContainerObject('INFORMATION_STATES', 'STATE_LAYER');
    this.relationshipsNode = new GroupContainerObject('RELATIONSHIPS', 'RELATIONSHIP_LAYER');
    this.clustersNode = new GroupContainerObject('CLUSTERS', 'CLUSTER_LAYER');
    this.dimensionsNode = new GroupContainerObject('DIMENSION_SPACE', 'DIMENSION_LAYER');
    this.effectsNode = new GroupContainerObject('EFFECTS', 'EFFECTS_LAYER');
    this.overlayNode = new GroupContainerObject('OVERLAY', 'OVERLAY_LAYER');

    this.root.addChild(this.coreNode);
    this.root.addChild(this.statesNode);
    this.root.addChild(this.relationshipsNode);
    this.root.addChild(this.clustersNode);
    this.root.addChild(this.dimensionsNode);
    this.root.addChild(this.effectsNode);
    this.root.addChild(this.overlayNode);
  }

  public update(deltaMs: number, timeMs: number): void {
    this.root.update(deltaMs, timeMs);
  }

  public render(context: unknown): void {
    this.root.render(context);
  }

  public clear(): void {
    // Retain root and structural containers, but clear their children
    for (const child of [
      this.statesNode,
      this.relationshipsNode,
      this.clustersNode,
      this.dimensionsNode,
      this.effectsNode,
      this.overlayNode,
    ]) {
      for (const obj of child.children) {
        child.removeChild(obj.id);
      }
    }
  }

  public dispose(): void {
    this.root.dispose();
  }
}
