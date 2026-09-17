/**
 * 3D Memory Studio — Funnel 58
 * Master Graph Engine
 */

import * as THREE from 'three';
import { GraphRegistry } from './graphRegistry';
import { GraphModel } from './graphModel';
import { EdgeMaterialManager } from '../edges/edgeMaterial';
import { GraphSelectionManager } from '../selection/graphSelectionManager';
import { GraphHighlightManager } from '../selection/graphHighlightManager';
import { GraphVisibilityManager } from '../visibility/graphVisibilityManager';
import { MaterialFactory } from '../../funnel57/materials/materialFactory';
import { MaterialRegistry } from '../../funnel57/materials/materialRegistry';
import { GraphEdgeMesh } from '../edges/graphEdge';
import { synchronizeSimulationToGraph } from '../adapters/simulationGraphAdapter';
import { syncSceneNodesToGraph } from '../adapters/sceneGraphAdapter';
import { SceneEngine } from '../../funnel56/scene/sceneEngine';
import { SimulationWorldState } from '../../funnel52/types';
import { GraphEngineStats, GraphFilterCriteria } from '../types';
import { applyFiltersToRegistry, createDefaultFilterCriteria } from './graphFilters';
import { prioritizeAndBoundEdges } from './graphPrioritizer';

export class GraphEngine {
  public readonly registry: GraphRegistry;
  public readonly model: GraphModel;
  public readonly selectionManager: GraphSelectionManager;
  public readonly highlightManager: GraphHighlightManager;
  public readonly visibilityManager: GraphVisibilityManager;
  public readonly materialManager: EdgeMaterialManager;
  public readonly edgeGroup: THREE.Group;

  private edgeMeshes: Map<string, GraphEdgeMesh> = new Map();
  private isDisposed = false;

  constructor() {
    this.registry = new GraphRegistry();
    this.model = new GraphModel();
    this.selectionManager = new GraphSelectionManager();
    this.highlightManager = new GraphHighlightManager();
    this.visibilityManager = new GraphVisibilityManager();

    const matReg = new MaterialRegistry();
    const matFact = new MaterialFactory(matReg);
    this.materialManager = new EdgeMaterialManager(matFact);

    this.edgeGroup = new THREE.Group();
  }

  public initialize(): void {
    if (this.isDisposed) throw new Error('Cannot initialize disposed GraphEngine.');
  }

  public synchronizeSimulation(world: SimulationWorldState): void {
    if (this.isDisposed) return;
    synchronizeSimulationToGraph(world, this.model, this.registry);
    this.rebuildEdgeMeshes();
  }

  public syncFromScene(sceneEngine: SceneEngine): void {
    if (this.isDisposed) return;
    syncSceneNodesToGraph(sceneEngine, this.model, this.registry, this.edgeMeshes);
  }

  public rebuildEdgeMeshes(): void {
    this.clearEdgeMeshes();

    for (const rel of this.registry.getAll()) {
      const mesh = new GraphEdgeMesh(rel, this.materialManager, 'STRAIGHT');
      this.edgeMeshes.set(rel.relationshipId, mesh);
      this.edgeGroup.add(mesh.lineObject);
    }
  }

  public selectNode(nodeId: string | null): void {
    this.selectionManager.selectNode(nodeId, this.model, this.registry);
    this.highlightManager.highlightNeighborhood(nodeId, this.model, this.registry);
    prioritizeAndBoundEdges(this.registry.getAll(), nodeId);
    this.updateMeshVisualStates();
  }

  public selectRelationship(relId: string | null): void {
    this.selectionManager.selectRelationship(relId, this.registry);
    this.updateMeshVisualStates();
  }

  public applyFilters(criteria: GraphFilterCriteria): void {
    applyFiltersToRegistry(this.registry.getAll(), criteria);
    this.updateMeshVisualStates();
  }

  public searchHighlight(query: string): number {
    const count = this.highlightManager.highlightBySearchQuery(query, this.model, this.registry);
    this.updateMeshVisualStates();
    return count;
  }

  private updateMeshVisualStates(): void {
    for (const [id, mesh] of this.edgeMeshes.entries()) {
      const rel = this.registry.getRelationship(id);
      if (rel) {
        mesh.visible = rel.visible;
        mesh.setSelected(rel.selected);
        mesh.setHighlighted(rel.highlighted);
      }
    }
  }

  public getStats(activeDim = 3): GraphEngineStats {
    let semantic = 0;
    let domain = 0;
    let category = 0;
    let source = 0;
    let sequence = 0;
    let coordinate = 0;

    for (const r of this.registry.getAll()) {
      switch (r.relationshipType) {
        case 'SEMANTIC': semantic++; break;
        case 'DOMAIN': domain++; break;
        case 'CATEGORY': category++; break;
        case 'SOURCE': source++; break;
        case 'SEQUENCE': sequence++; break;
        case 'COORDINATE': coordinate++; break;
      }
    }

    const visibleEdges = this.registry.getVisible().length;

    return {
      totalNodes: this.model.count,
      visibleNodes: this.model.getAllNodes().filter((n) => n.visible).length,
      totalRelationships: this.registry.count,
      visibleEdges,
      semanticCount: semantic,
      domainCount: domain,
      categoryCount: category,
      sourceCount: source,
      sequenceCount: sequence,
      coordinateCount: coordinate,
      selectedNodeId: this.selectionManager.getSelectedNodeId(),
      selectedRelationshipId: this.selectionManager.getSelectedRelationshipId(),
      activeDimension: activeDim as any,
      isComputationalProjection: activeDim > 3,
    };
  }

  public clearEdgeMeshes(): void {
    for (const mesh of this.edgeMeshes.values()) {
      this.edgeGroup.remove(mesh.lineObject);
      mesh.dispose();
    }
    this.edgeMeshes.clear();
  }

  public dispose(): void {
    if (this.isDisposed) return;
    this.isDisposed = true;
    this.clearEdgeMeshes();
    this.materialManager.dispose();
    this.registry.clear();
    this.model.clear();
  }
}
