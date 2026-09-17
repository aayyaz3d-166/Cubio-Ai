/**
 * 3D Memory Studio — Funnel 59
 * Master Cluster & Spatial Organization Engine
 */

import * as THREE from 'three';
import { ClusterRegistry } from './clusterRegistry';
import { ClusterMembershipManager } from './clusterMembership';
import { ClusterSelectionManager } from '../selection/clusterSelectionManager';
import { ClusterHighlightManager } from '../selection/clusterHighlightManager';
import { ClusterVisibilityManager } from '../visibility/clusterVisibilityManager';
import { ClusterMaterialManager } from '../materials/clusterMaterial';
import { MaterialFactory } from '../../funnel57/materials/materialFactory';
import { MaterialRegistry } from '../../funnel57/materials/materialRegistry';
import { ClusterMeshWrapper } from '../geometry/clusterGeometry';
import { synchronizeSimulationToClusters } from '../adapters/simulationClusterAdapter';
import { syncSceneToClusters } from '../adapters/sceneClusterAdapter';
import { SceneEngine } from '../../funnel56/scene/sceneEngine';
import { SimulationWorldState } from '../../funnel52/types';
import { GraphRegistry } from '../../funnel58/graph/graphRegistry';
import { ClusterEngineStats, ClusterLayoutMode, Cluster } from '../types';
import { applyClusterLayout } from '../spatial/clusterLayoutEngine';
import { prioritizeAndBoundClusters } from './clusterPrioritizer';

export class ClusterEngine {
  public readonly registry: ClusterRegistry;
  public readonly membershipManager: ClusterMembershipManager;
  public readonly selectionManager: ClusterSelectionManager;
  public readonly highlightManager: ClusterHighlightManager;
  public readonly visibilityManager: ClusterVisibilityManager;
  public readonly materialManager: ClusterMaterialManager;
  public readonly clusterGroup: THREE.Group;

  private clusterMeshes: Map<string, ClusterMeshWrapper> = new Map();
  private currentLayoutMode: ClusterLayoutMode = 'RADIAL';
  private isDisposed = false;

  constructor() {
    this.registry = new ClusterRegistry();
    this.membershipManager = new ClusterMembershipManager();
    this.selectionManager = new ClusterSelectionManager();
    this.highlightManager = new ClusterHighlightManager();
    this.visibilityManager = new ClusterVisibilityManager();

    const matReg = new MaterialRegistry();
    const matFact = new MaterialFactory(matReg);
    this.materialManager = new ClusterMaterialManager(matFact);

    this.clusterGroup = new THREE.Group();
  }

  public initialize(): void {
    if (this.isDisposed) throw new Error('Cannot initialize disposed ClusterEngine.');
  }

  public synchronizeSimulation(world: SimulationWorldState, graphRegistry: GraphRegistry): void {
    if (this.isDisposed) return;
    synchronizeSimulationToClusters(world, graphRegistry, this.registry, this.currentLayoutMode);
    this.rebuildClusterMeshes();
  }

  public syncFromScene(sceneEngine: SceneEngine): void {
    if (this.isDisposed) return;
    syncSceneToClusters(sceneEngine, this.registry, this.clusterMeshes);
  }

  public setLayoutMode(mode: ClusterLayoutMode): void {
    this.currentLayoutMode = mode;
    const all = this.registry.getAll() as Cluster[];
    applyClusterLayout(all, mode);
    this.updateMeshTransforms();
  }

  public get layoutMode(): ClusterLayoutMode {
    return this.currentLayoutMode;
  }

  public rebuildClusterMeshes(): void {
    this.clearClusterMeshes();

    for (const cluster of this.registry.getAll()) {
      const mesh = new ClusterMeshWrapper(cluster, this.materialManager);
      this.clusterMeshes.set(cluster.clusterId, mesh);
      this.clusterGroup.add(mesh.groupObject);
    }
  }

  public selectCluster(clusterId: string | null): Cluster | null {
    const selected = this.selectionManager.selectCluster(clusterId, this.registry);
    this.highlightManager.highlightCluster(clusterId, this.registry);
    prioritizeAndBoundClusters(this.registry.getAll(), clusterId, null);
    this.updateMeshVisualStates();
    return selected;
  }

  public searchHighlight(query: string): number {
    const count = this.highlightManager.highlightBySearchQuery(query, this.registry);
    this.updateMeshVisualStates();
    return count;
  }

  private updateMeshTransforms(): void {
    for (const [id, mesh] of this.clusterMeshes.entries()) {
      const c = this.registry.getCluster(id);
      if (c) {
        mesh.updateGeometry(c.center, c.radius);
      }
    }
  }

  private updateMeshVisualStates(): void {
    for (const [id, mesh] of this.clusterMeshes.entries()) {
      const c = this.registry.getCluster(id);
      if (c) {
        mesh.visible = c.visible;
        mesh.setSelected(c.selected);
        mesh.setHighlighted(c.highlighted);
      }
    }
  }

  public getStats(activeDim = 3): ClusterEngineStats {
    let totalMembers = 0;
    let internalEdges = 0;
    let externalEdges = 0;

    for (const c of this.registry.getAll()) {
      totalMembers += c.memberStateIds.length;
      internalEdges += c.metrics.internalEdgeCount;
      externalEdges += c.metrics.externalEdgeCount;
    }

    const visibleClusters = this.registry.getVisible().length;

    return {
      totalClusters: this.registry.count,
      visibleClusters,
      totalMembers,
      internalEdges,
      externalEdges,
      selectedClusterId: this.selectionManager.getSelectedClusterId(),
      layoutMode: this.currentLayoutMode,
      activeDimension: activeDim as any,
      isComputationalProjection: activeDim > 3,
    };
  }

  public clearClusterMeshes(): void {
    for (const mesh of this.clusterMeshes.values()) {
      this.clusterGroup.remove(mesh.groupObject);
      mesh.dispose();
    }
    this.clusterMeshes.clear();
  }

  public dispose(): void {
    if (this.isDisposed) return;
    this.isDisposed = true;
    this.clearClusterMeshes();
    this.materialManager.dispose();
    this.registry.clear();
  }
}
