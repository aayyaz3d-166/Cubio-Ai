/**
 * 3D Memory Studio — Funnel 60
 * Master Dimension & Projection Engine
 */

import * as THREE from 'three';
import { DimensionRegistry } from './dimensionRegistry';
import { DimensionSwitcher } from './dimensionSwitcher';
import { DimensionSelectionManager } from '../selection/dimensionSelectionManager';
import { DimensionHighlightManager } from '../selection/dimensionHighlightManager';
import { DimensionVisibilityManager } from '../visibility/dimensionVisibilityManager';
import { DimensionComparisonManager } from '../comparison/dimensionComparisonManager';
import { DimensionVisualGroup } from '../geometry/dimensionGridGeometry';
import { createDimensionCoordinate } from '../transform/dimensionTransformSystem';
import { applyProjectionsToScene } from '../adapters/dimensionSceneAdapter';
import { applyProjectionsToGraph } from '../adapters/dimensionGraphAdapter';
import { applyProjectionsToClusters } from '../adapters/dimensionClusterAdapter';
import { filterSecureProjectionStates } from '../adapters/dimensionSecurityAdapter';
import { SceneEngine } from '../../funnel56/scene/sceneEngine';
import { GraphRegistry } from '../../funnel58/graph/graphRegistry';
import { ClusterRegistry } from '../../funnel59/cluster/clusterRegistry';
import { DimensionalInformationState } from '../../funnel49/types';
import { SimulatedStateNode } from '../../funnel52/types';
import { GraphNode } from '../../funnel58/types';
import { SimulationDimension } from '../../funnel52/types';
import { DimensionCoordinate, DimensionEngineStats, ProjectionType, DimensionId } from '../types';

export class DimensionEngine {
  public readonly registry: DimensionRegistry;
  public readonly switcher: DimensionSwitcher;
  public readonly selectionManager: DimensionSelectionManager;
  public readonly highlightManager: DimensionHighlightManager;
  public readonly visibilityManager: DimensionVisibilityManager;
  public readonly comparisonManager: DimensionComparisonManager;
  public readonly visualGroup: DimensionVisualGroup;

  private projectionCache: Map<string, DimensionCoordinate> = new Map();
  private isDisposed = false;

  constructor() {
    this.registry = new DimensionRegistry();
    this.switcher = new DimensionSwitcher(this.registry);
    this.selectionManager = new DimensionSelectionManager();
    this.highlightManager = new DimensionHighlightManager();
    this.visibilityManager = new DimensionVisibilityManager();
    this.comparisonManager = new DimensionComparisonManager();
    this.visualGroup = new DimensionVisualGroup(3);
  }

  public initialize(): void {
    if (this.isDisposed) throw new Error('Cannot initialize disposed DimensionEngine.');
  }

  public setDimension(dim: SimulationDimension, projection?: ProjectionType): boolean {
    if (this.isDisposed) return false;
    const switched = this.switcher.setDimension(dim, projection);
    if (switched) {
      this.visualGroup.updateDimension(dim);
    }
    return switched;
  }

  public projectStates(
    states: readonly (DimensionalInformationState | SimulatedStateNode | GraphNode)[]
  ): readonly DimensionCoordinate[] {
    if (this.isDisposed) return [];

    const secureStates = filterSecureProjectionStates(states);
    this.projectionCache.clear();

    const dim = this.switcher.dimension;
    const proj = this.switcher.projection;

    for (const s of secureStates) {
      const coord = createDimensionCoordinate(s, dim, proj);
      this.projectionCache.set(s.stateId, coord);
    }

    return Array.from(this.projectionCache.values());
  }

  public synchronizeAll(
    sceneEngine?: SceneEngine,
    graphRegistry?: GraphRegistry,
    clusterRegistry?: ClusterRegistry
  ): void {
    const coords = Array.from(this.projectionCache.values());
    if (sceneEngine) applyProjectionsToScene(coords, sceneEngine);
    if (graphRegistry) applyProjectionsToGraph(coords, graphRegistry);
    if (clusterRegistry) applyProjectionsToClusters(coords, clusterRegistry);
  }

  public getCoordinate(stateId: string): DimensionCoordinate | undefined {
    return this.projectionCache.get(stateId);
  }

  public getAllProjections(): readonly DimensionCoordinate[] {
    return Array.from(this.projectionCache.values());
  }

  public getStats(): DimensionEngineStats {
    const dim = this.switcher.dimension;
    const desc = this.registry.getByNumber(dim);

    return {
      activeDimension: dim,
      activeDimensionId: `Z${dim}` as DimensionId,
      projectionType: this.switcher.projection,
      isPhysicalSpatial: desc?.isPhysicalSpatial ?? false,
      isComputationalProjection: desc?.isComputationalProjection ?? true,
      totalSupportedDimensions: this.registry.count,
      projectedStatesCount: this.projectionCache.size,
      projectedRelationshipsCount: 0,
      projectedClustersCount: 0,
      comparisonActive: this.comparisonManager.isComparing,
      comparedDimensions: this.comparisonManager.activeDimensions,
    };
  }

  public dispose(): void {
    if (this.isDisposed) return;
    this.isDisposed = true;
    this.projectionCache.clear();
    this.visualGroup.dispose();
    this.registry.clear();
  }
}
