/**
 * 3D Memory Studio — Funnel 64
 * Master Studio Workspace Manager
 *
 * Orchestrates panels, layout, selection, viewport, and backend adapters.
 */

import { PanelRegistry } from '../panels/panelRegistry';
import { PanelManager } from '../panels/panelManager';
import { WorkspaceStateMachine } from './workspaceState';
import { WorkspaceLayoutEngine } from './workspaceLayoutEngine';
import { WorkspaceSelectionManager } from './workspaceSelectionManager';
import { WorkspaceModelRegistry } from '../panels/chat/modelRegistry';
import { LLMPanelAdapter } from '../panels/chat/llmPanelAdapter';
import { SearchWorkspaceAdapter } from '../adapters/searchWorkspaceAdapter';
import { DatabasePanelAdapter } from '../adapters/databasePanelAdapter';
import { getStandardInformationUniverseFixture } from '../../funnel49/model';
import { GraphWorkspaceAdapter } from '../adapters/graphWorkspaceAdapter';
import { ClusterWorkspaceAdapter } from '../adapters/clusterWorkspaceAdapter';
import { DimensionWorkspaceAdapter } from '../adapters/dimensionWorkspaceAdapter';
import { CameraWorkspaceAdapter } from '../adapters/cameraWorkspaceAdapter';
import { WorkspaceViewportAdapter } from '../viewport/WorkspaceViewportAdapter';

import { GraphEngine } from '../../funnel58/graph/graphEngine';
import { ClusterEngine } from '../../funnel59/cluster/clusterEngine';
import { DimensionEngine } from '../../funnel60/dimension/dimensionEngine';
import { CameraEngine } from '../../funnel61/camera/cameraEngine';
import { SceneEngine } from '../../funnel56/scene/sceneEngine';
import { MemoryRendererHost } from '../../funnel55/renderer/rendererHost';
import { RealTimeSimulationEngine } from '../../funnel52/simulation/simulationEngine';
import { SimulationDimension } from '../../funnel52/types';
import { ProjectionType } from '../../funnel60/types';
import { DataClassification } from '../../funnel47/types';
import { WorkspaceContextSnapshot, PanelId } from '../types';
import { createWorkspaceContextSnapshot } from './workspaceContext';

export class StudioWorkspaceManager {
  public readonly stateMachine: WorkspaceStateMachine;
  public readonly panelRegistry: PanelRegistry;
  public readonly panelManager: PanelManager;
  public readonly layoutEngine: WorkspaceLayoutEngine;
  public readonly selectionManager: WorkspaceSelectionManager;
  public readonly modelRegistry: WorkspaceModelRegistry;
  public readonly llmAdapter: LLMPanelAdapter;
  public readonly searchAdapter: SearchWorkspaceAdapter;
  public readonly databaseAdapter: DatabasePanelAdapter;

  public readonly graphAdapter: GraphWorkspaceAdapter;
  public readonly clusterAdapter: ClusterWorkspaceAdapter;
  public readonly dimensionAdapter: DimensionWorkspaceAdapter;
  public readonly cameraAdapter: CameraWorkspaceAdapter;
  public readonly viewportAdapter: WorkspaceViewportAdapter;
  public readonly sceneEngine: SceneEngine;

  private graphEngine: GraphEngine;
  private clusterEngine: ClusterEngine;
  private dimensionEngine: DimensionEngine;
  private cameraEngine: CameraEngine;
  public rendererHost: MemoryRendererHost;
  private simEngine: RealTimeSimulationEngine | null = null;
  private isDisposed = false;

  constructor() {
    this.stateMachine = new WorkspaceStateMachine();
    this.panelRegistry = new PanelRegistry();
    this.panelManager = new PanelManager(this.panelRegistry);
    this.layoutEngine = new WorkspaceLayoutEngine();
    this.selectionManager = new WorkspaceSelectionManager();
    this.modelRegistry = new WorkspaceModelRegistry();
    this.llmAdapter = new LLMPanelAdapter();
    this.searchAdapter = new SearchWorkspaceAdapter();
    this.databaseAdapter = new DatabasePanelAdapter();

    this.graphEngine = new GraphEngine();
    this.clusterEngine = new ClusterEngine();
    this.dimensionEngine = new DimensionEngine();
    this.cameraEngine = new CameraEngine();
    this.sceneEngine = new SceneEngine();
    this.rendererHost = new MemoryRendererHost();

    this.graphAdapter = new GraphWorkspaceAdapter(this.graphEngine);
    this.clusterAdapter = new ClusterWorkspaceAdapter(this.clusterEngine);
    this.dimensionAdapter = new DimensionWorkspaceAdapter(this.dimensionEngine);
    this.cameraAdapter = new CameraWorkspaceAdapter(this.cameraEngine);
    this.viewportAdapter = new WorkspaceViewportAdapter(this.rendererHost, this.cameraEngine);
  }

  public async initialize(): Promise<void> {
    if (this.isDisposed) throw new Error('Cannot initialize disposed StudioWorkspaceManager.');

    this.graphEngine.initialize();
    this.clusterEngine.initialize();
    this.dimensionEngine.initialize();
    this.cameraEngine.initialize();
    this.sceneEngine.initialize();
    this.rendererHost.initialize();

    this.simEngine = new RealTimeSimulationEngine();
    const initWorld = this.simEngine.getState();

    const fixture = getStandardInformationUniverseFixture();
    const stateMap = new Map<string, any>();
    for (const s of [...(initWorld.allSourceStates || []), ...fixture.states]) {
      stateMap.set(s.stateId, s);
    }
    const allStates = Array.from(stateMap.values());

    this.graphEngine.synchronizeSimulation(initWorld);
    this.clusterEngine.synchronizeSimulation(initWorld, this.graphEngine.registry);
    this.dimensionEngine.projectStates(allStates);
    this.sceneEngine.synchronizeWithSimulation({
      ...initWorld,
      allSourceStates: allStates,
    });

    this.stateMachine.transitionTo('READY');
  }

  public selectState(stateId: string | null, classification: DataClassification = 'GREEN'): boolean {
    if (this.isDisposed) return false;

    const allowed = this.selectionManager.selectState(stateId, classification);
    if (!allowed) {
      return false; // F47 Security Rejection
    }

    if (stateId) {
      // 1. Highlight graph
      this.graphAdapter.highlightNode(stateId);

      // 2. Highlight cluster
      this.clusterAdapter.highlightClusterForState(stateId);

      // 3. Focus camera on projected coordinate
      const coord = this.dimensionAdapter.getCoordinate(stateId);
      if (coord) {
        this.cameraAdapter.focusState(stateId, coord.projectedPosition, 20);
      }
    } else {
      this.graphAdapter.highlightNode(null);
      this.clusterAdapter.highlightClusterForState(null);
    }

    return true;
  }

  public async searchAndSelect(query: string): Promise<string | null> {
    const results = await this.searchAdapter.search(query);
    if (results.length > 0) {
      const top = results[0].stateId;
      this.selectState(top);
      this.panelManager.openPanel('INFORMATION');
      return top;
    }
    return null;
  }

  public switchDimension(dim: SimulationDimension, proj?: ProjectionType): boolean {
    const ok = this.dimensionAdapter.setDimension(dim, proj);
    if (ok && this.simEngine) {
      const world = this.simEngine.getState();
      const fixture = getStandardInformationUniverseFixture();
      const stateMap = new Map<string, any>();
      for (const s of [...(world.allSourceStates || []), ...fixture.states]) {
        stateMap.set(s.stateId, s);
      }
      const allStates = Array.from(stateMap.values());
      this.dimensionEngine.projectStates(allStates);
      this.sceneEngine.synchronizeWithSimulation({
        ...world,
        activeDimension: dim,
        allSourceStates: allStates,
      });

      if (this.selectionManager.currentStateId) {
        const coord = this.dimensionAdapter.getCoordinate(this.selectionManager.currentStateId);
        if (coord) {
          this.cameraAdapter.focusState(this.selectionManager.currentStateId, coord.projectedPosition, 20);
        }
      }
    }
    return ok;
  }

  public resetWorkspace(): void {
    this.selectionManager.clearSelection();
    this.panelRegistry.reset();
    this.layoutEngine.setLayout('SIDEBAR');
    this.switchDimension(3, 'DIRECT');
    this.cameraAdapter.resetCamera();
    this.stateMachine.reset();
  }

  public getContextSnapshot(): WorkspaceContextSnapshot {
    const activePanels = this.panelRegistry.getActivePanels();
    const visiblePanels = this.panelRegistry.getVisiblePanels();

    return createWorkspaceContextSnapshot(
      activePanels[0]?.panelId ?? null,
      visiblePanels.map((p) => p.panelId),
      this.layoutEngine.layout,
      this.selectionManager.currentStateId,
      this.selectionManager.currentRelationshipId,
      this.selectionManager.currentClusterId,
      this.dimensionAdapter.activeDimension,
      this.cameraAdapter.cameraMode,
      this.panelRegistry.count
    );
  }

  public dispose(): void {
    if (this.isDisposed) return;
    this.stateMachine.transitionTo('DISPOSING');
    this.isDisposed = true;

    if (this.simEngine) this.simEngine.destroy();
    this.graphEngine.dispose();
    this.clusterEngine.dispose();
    this.dimensionEngine.dispose();
    this.cameraEngine.dispose();
    this.sceneEngine.dispose();
    this.rendererHost.dispose();
    this.viewportAdapter.dispose();
    this.panelRegistry.dispose();

    this.stateMachine.transitionTo('DISPOSED');
  }
}
