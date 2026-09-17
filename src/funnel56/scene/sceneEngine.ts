/**
 * 3D Memory Studio — Funnel 56
 * Master 3D Scene Engine
 *
 * Implements deterministic Scene Engine core coordinating SceneGraph,
 * LayerManager, Registry, Visibility, Selection, and F55 Renderer Host.
 */

import {
  SceneEngineLifecycleState,
  SceneEngineStats,
  ISceneObject,
} from '../types';
import { SceneGraph } from './sceneGraph';
import { SceneRegistry } from './sceneRegistry';
import { LayerManager } from '../layers/layerManager';
import { SceneVisibilityManager } from '../visibility/visibilityManager';
import { SceneSelectionManager } from '../selection/selectionManager';
import { HighlightManager } from '../selection/highlightManager';
import { SimulationWorldState, SimulationDimension } from '../../funnel52/types';
import { synchronizeSimulationWithScene } from '../adapters/simulationSceneAdapter';
import { MemoryRendererHost } from '../../funnel55/renderer/rendererHost';

export class SceneEngine {
  private lifecycleState: SceneEngineLifecycleState = 'CREATED';
  public readonly graph: SceneGraph;
  public readonly registry: SceneRegistry;
  public readonly layerManager: LayerManager;
  public readonly visibility: SceneVisibilityManager;
  public readonly selection: SceneSelectionManager;
  public readonly highlights: HighlightManager;

  private rendererHost: MemoryRendererHost | null = null;
  private activeDimension: SimulationDimension = 3;
  private isDisposed = false;

  constructor() {
    this.graph = new SceneGraph();
    this.registry = new SceneRegistry();
    this.layerManager = new LayerManager();
    this.visibility = new SceneVisibilityManager(this.layerManager);
    this.selection = new SceneSelectionManager(this.registry);
    this.highlights = new HighlightManager(this.registry);
  }

  public initialize(): void {
    if (this.isDisposed) throw new Error('Cannot initialize disposed SceneEngine.');
    if (this.lifecycleState !== 'CREATED') return;

    this.lifecycleState = 'INITIALIZED';
  }

  public attachRenderer(host: MemoryRendererHost): void {
    if (this.isDisposed) throw new Error('Cannot attach renderer to disposed SceneEngine.');
    this.initialize();
    this.rendererHost = host;
    this.lifecycleState = 'ATTACHED';
    this.lifecycleState = 'READY';
  }

  public synchronizeWithSimulation(world: SimulationWorldState): void {
    if (this.isDisposed) return;
    this.activeDimension = world.activeDimension;
    synchronizeSimulationWithScene(world, this.graph, this.registry, this.layerManager);
  }

  public selectObject(id: string | null): ISceneObject | null {
    return this.selection.selectObject(id);
  }

  public clearSelection(): void {
    this.selection.clearSelection();
  }

  public highlightSearch(query: string): number {
    return this.highlights.highlightSearchMatches(query);
  }

  public update(deltaMs: number, timeMs: number): void {
    if (this.isDisposed || this.lifecycleState === 'PAUSED') return;

    // 1. Update scene graph hierarchy (transforms & rotations)
    this.graph.update(deltaMs, timeMs);

    // 2. Update layers
    this.layerManager.update(deltaMs, timeMs);
  }

  public render(context: unknown): void {
    if (this.isDisposed) return;
    this.layerManager.render(context);
  }

  public getStats(): SceneEngineStats {
    const states = this.registry.getByType('STATE');
    const relationships = this.registry.getByType('RELATIONSHIP');
    const clusters = this.registry.getByType('CLUSTER');
    const dimensions = this.registry.getByType('DIMENSION');

    return Object.freeze({
      totalObjects: this.registry.count,
      visibleStates: states.filter((s) => s.visible).length,
      visibleRelationships: relationships.filter((r) => r.visible).length,
      totalClusters: clusters.length,
      totalDimensionObjects: dimensions.length,
      activeLayerCount: this.layerManager.getAllLayers().filter((l) => l.visible).length,
      selectedObjectId: this.selection.getSelectedObjectId(),
      highlightedCount: this.highlights.highlightedCount,
      activeDimension: this.activeDimension,
      lifecycleState: this.lifecycleState,
    });
  }

  public get state(): SceneEngineLifecycleState {
    return this.lifecycleState;
  }

  public dispose(): void {
    if (this.isDisposed) return;
    this.isDisposed = true;
    this.lifecycleState = 'DISPOSED';

    this.graph.dispose();
    this.registry.clear();
    this.layerManager.dispose();
    this.rendererHost = null;
  }
}
