/**
 * 3D Memory Studio — Funnel 62
 * Master Studio Coordinator
 *
 * Orchestrates Scene (F56), Graph (F58), Cluster (F59), Dimension (F60),
 * Camera (F61), Renderer (F55), Selection, and AI LLM Context.
 */

import { SceneEngine } from '../../funnel56/scene/sceneEngine';
import { GraphEngine } from '../../funnel58/graph/graphEngine';
import { ClusterEngine } from '../../funnel59/cluster/clusterEngine';
import { DimensionEngine } from '../../funnel60/dimension/dimensionEngine';
import { CameraEngine } from '../../funnel61/camera/cameraEngine';
import { MemoryRendererHost } from '../../funnel55/renderer/rendererHost';
import { RealTimeSimulationEngine } from '../../funnel52/simulation/simulationEngine';
import { ModelRegistry } from '../ai/modelRegistry';
import { StudioSelectionManager } from '../selection/studioSelectionManager';
import { LandingTransitionController } from '../landing/landingTransition';
import { SimulationDataProvider } from '../data/dataProvider';
import { buildAIContextFromSelectedState } from '../ai/aiContextBuilder';
import { SimulationDimension } from '../../funnel52/types';
import { ProjectionType } from '../../funnel60/types';
import { CameraPresetType } from '../../funnel61/types';
import { StudioSessionState, DataProvider } from '../types';
import { AIContextPayload } from '../ai/llmTypes';
import { createDefaultStudioSessionState } from '../studio/studioState';

export class StudioCoordinator {
  public readonly sceneEngine: SceneEngine;
  public readonly graphEngine: GraphEngine;
  public readonly clusterEngine: ClusterEngine;
  public readonly dimensionEngine: DimensionEngine;
  public readonly cameraEngine: CameraEngine;
  public readonly renderer: MemoryRendererHost;
  public readonly modelRegistry: ModelRegistry;
  public readonly selectionManager: StudioSelectionManager;
  public readonly landingTransition: LandingTransitionController;
  public readonly dataProvider: DataProvider;

  public sessionState: StudioSessionState;
  private simEngine: RealTimeSimulationEngine | null = null;
  private isDisposed = false;

  constructor(dataProvider?: DataProvider) {
    this.sceneEngine = new SceneEngine();
    this.graphEngine = new GraphEngine();
    this.clusterEngine = new ClusterEngine();
    this.dimensionEngine = new DimensionEngine();
    this.cameraEngine = new CameraEngine();
    this.renderer = new MemoryRendererHost();
    this.modelRegistry = new ModelRegistry();
    this.selectionManager = new StudioSelectionManager();
    this.landingTransition = new LandingTransitionController();
    this.dataProvider = dataProvider || new SimulationDataProvider();
    this.sessionState = createDefaultStudioSessionState();
  }

  public async initialize(): Promise<void> {
    if (this.isDisposed) throw new Error('Cannot initialize disposed StudioCoordinator.');

    this.sceneEngine.initialize();
    this.graphEngine.initialize();
    this.clusterEngine.initialize();
    this.dimensionEngine.initialize();
    this.cameraEngine.initialize();
    this.renderer.initialize();

    this.simEngine = new RealTimeSimulationEngine();
    const initWorld = this.simEngine.getState();

    // 1. Initial Scene sync
    this.sceneEngine.synchronizeWithSimulation(initWorld);
    this.graphEngine.synchronizeSimulation(initWorld);
    this.clusterEngine.synchronizeSimulation(initWorld, this.graphEngine.registry);

    // 2. Initial Dimension Projection sync
    this.dimensionEngine.projectStates(initWorld.allSourceStates || []);
    this.dimensionEngine.synchronizeAll(
      this.sceneEngine,
      this.graphEngine.registry,
      this.clusterEngine.registry
    );

    // 3. Initial Camera sync
    this.cameraEngine.syncToRenderer(this.renderer);
  }

  public update(deltaSeconds: number): void {
    if (this.isDisposed) return;

    // Update landing transition if active
    if (this.landingTransition.active) {
      const trans = this.landingTransition.update(deltaSeconds);
      if (trans.isCompleted) {
        this.sessionState.currentScreen = 'STUDIO';
        this.sessionState.isTransitioning = false;
      }
    }

    // Update camera transition and sync to renderer
    this.cameraEngine.update(deltaSeconds);
    this.cameraEngine.syncToRenderer(this.renderer);
  }

  public startStudio(): void {
    this.sessionState.isTransitioning = true;
    this.landingTransition.startTransition(600);
  }

  public selectState(stateId: string | null): void {
    if (this.isDisposed) return;
    this.selectionManager.selectState(stateId);
    this.sessionState.selectedStateId = stateId;

    if (stateId) {
      // 1. Highlight in Graph
      this.graphEngine.highlightManager.highlightNeighborhood(
        stateId,
        this.graphEngine.model,
        this.graphEngine.registry
      );

      // 2. Highlight in Cluster
      this.clusterEngine.highlightManager.highlightByStateId(
        stateId,
        this.clusterEngine.registry
      );

      // 3. Focus Camera on projected coordinate
      const projected = this.dimensionEngine.getCoordinate(stateId);
      if (projected) {
        this.cameraEngine.navigation.focusManager.focusState(
          this.cameraEngine.state,
          stateId,
          projected.projectedPosition,
          20
        );
      }
    } else {
      this.graphEngine.highlightManager.clearHighlights(
        this.graphEngine.model,
        this.graphEngine.registry
      );
      this.clusterEngine.highlightManager.clearHighlights(this.clusterEngine.registry);
    }
  }

  public async searchAndSelect(query: string): Promise<string | null> {
    const results = await this.dataProvider.searchStates(query);
    if (results.length > 0) {
      const match = results[0].stateId;
      this.selectState(match);
      return match;
    }
    return null;
  }

  public switchDimension(dim: SimulationDimension, proj?: ProjectionType): boolean {
    const ok = this.dimensionEngine.setDimension(dim, proj);
    if (ok) {
      this.sessionState.activeDimension = dim;
      this.sessionState.projectionMode = proj || this.dimensionEngine.switcher.projection;

      if (this.simEngine) {
        const world = this.simEngine.getState();
        this.dimensionEngine.projectStates(world.allSourceStates || []);
        this.dimensionEngine.synchronizeAll(
          this.sceneEngine,
          this.graphEngine.registry,
          this.clusterEngine.registry
        );
      }

      // Re-focus camera on selected state if any
      if (this.sessionState.selectedStateId) {
        const projected = this.dimensionEngine.getCoordinate(this.sessionState.selectedStateId);
        if (projected) {
          this.cameraEngine.navigation.focusManager.focusState(
            this.cameraEngine.state,
            this.sessionState.selectedStateId,
            projected.projectedPosition,
            20
          );
        }
      }
    }
    return ok;
  }

  public applyCameraPreset(preset: CameraPresetType): void {
    this.cameraEngine.navigation.setPreset(this.cameraEngine.state, preset);
    this.sessionState.cameraPreset = preset;
    this.cameraEngine.syncToRenderer(this.renderer);
  }

  public resetStudio(): void {
    this.selectionManager.clearSelection();
    this.sessionState = createDefaultStudioSessionState();
    this.sessionState.currentScreen = 'STUDIO'; // Keep in studio on reset
    this.switchDimension(3, 'DIRECT');
    this.cameraEngine.navigation.resetCamera(this.cameraEngine.state);
    this.cameraEngine.syncToRenderer(this.renderer);
  }

  public getSelectedAIContext(): AIContextPayload | null {
    if (!this.sessionState.selectedStateId || !this.simEngine) return null;
    const world = this.simEngine.getState();
    const state = world.allSourceStates?.find(
      (s) => s.stateId === this.sessionState.selectedStateId
    );
    return buildAIContextFromSelectedState(
      state,
      this.graphEngine.registry,
      this.clusterEngine.registry,
      this.sessionState.activeDimension
    );
  }

  public dispose(): void {
    if (this.isDisposed) return;
    this.isDisposed = true;
    if (this.simEngine) this.simEngine.destroy();
    this.sceneEngine.dispose();
    this.graphEngine.dispose();
    this.clusterEngine.dispose();
    this.dimensionEngine.dispose();
    this.cameraEngine.dispose();
    this.renderer.dispose();
    this.selectionManager.clearSelection();
  }
}
