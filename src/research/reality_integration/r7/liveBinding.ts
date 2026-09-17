/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R7: Master Live Binding Engine (Facade)
 *
 * Connects R6 Workspace -> R7 Scene Graph -> 3D Viewport -> Inspector -> Telemetry.
 *
 * Invariant: Unidirectional causality.
 * Downstream visual, camera, selection, and UI mutations never mutate Reality (Delta Reality = 0).
 */

import { WorkspaceState } from '../r6/types';
import {
  R7SceneGraph,
  R7SelectionVisualState,
  R7CameraState,
  R7LayerToggles,
  R7LiveSyncStatus,
  R7VisualizationSnapshot,
  R7VisualizationValidationReport,
  R7VisualizationExecutionSignature,
  R7VisualObject,
} from './types';
import { SceneGraphEngine } from './sceneGraph';
import { SelectionVisualizationEngine } from './selectionVisualization';
import { CameraIsolationEngine } from './cameraIsolation';
import { StaleStateEngine } from './staleState';
import { VisualizationSnapshotEngine } from './snapshot';
import { VisualizationValidator } from './validator';
import { R7CausalityAuditor, R7CausalityEvent } from './causality';
import { deterministicHash } from './determinism';

export class RealityLiveBindingEngine {
  private currentSceneGraph: R7SceneGraph;
  private currentWorkspaceState: WorkspaceState;
  private selectionState: R7SelectionVisualState;
  private cameraState: R7CameraState;
  private layerToggles: R7LayerToggles;
  private causalityAuditor: R7CausalityAuditor;
  private lastSyncedRealityChecksum: string;

  public static readonly DEFAULT_LAYER_TOGGLES: R7LayerToggles = Object.freeze({
    showRealityObjects: true,
    showRelationships: true,
    showSpatial: true,
    showTopology: true,
    showLabels: true,
    showAxes: true,
    showGrid: true,
  });

  constructor(initialWorkspaceState: WorkspaceState, seq = 0) {
    this.currentWorkspaceState = initialWorkspaceState;
    this.lastSyncedRealityChecksum = initialWorkspaceState.realityBinding.realityStateChecksum;
    this.selectionState = SelectionVisualizationEngine.createEmptySelection();
    this.cameraState = CameraIsolationEngine.DEFAULT_CAMERA;
    this.layerToggles = RealityLiveBindingEngine.DEFAULT_LAYER_TOGGLES;
    this.causalityAuditor = new R7CausalityAuditor();

    this.currentSceneGraph = SceneGraphEngine.buildSceneGraph(
      initialWorkspaceState,
      null,
      seq
    );

    this.causalityAuditor.logEvent(
      'INITIALIZE_VISUALIZATION',
      'VISUALIZATION',
      this.lastSyncedRealityChecksum,
      this.lastSyncedRealityChecksum
    );
  }

  // ─── Getters ───

  public getSceneGraph(): R7SceneGraph {
    return this.currentSceneGraph;
  }

  public getWorkspaceState(): WorkspaceState {
    return this.currentWorkspaceState;
  }

  public getSelection(): R7SelectionVisualState {
    return this.selectionState;
  }

  public getCamera(): R7CameraState {
    return this.cameraState;
  }

  public getLayerToggles(): R7LayerToggles {
    return this.layerToggles;
  }

  public getSyncStatus(currentRealityChecksum: string = this.currentWorkspaceState.realityBinding.realityStateChecksum): R7LiveSyncStatus {
    return StaleStateEngine.evaluateSync(
      currentRealityChecksum,
      this.lastSyncedRealityChecksum
    );
  }

  public getSelectedVisualObject(): R7VisualObject | null {
    return SelectionVisualizationEngine.findSelectedObject(
      this.currentSceneGraph,
      this.selectionState
    );
  }

  // ─── Downstream Mutations (Delta Reality = 0) ───

  public selectObject(visualObjectId: string | null): void {
    this.selectionState = SelectionVisualizationEngine.selectVisualObject(
      visualObjectId,
      this.selectionState
    );

    this.currentSceneGraph = SceneGraphEngine.buildSceneGraph(
      this.currentWorkspaceState,
      visualObjectId
    );

    this.causalityAuditor.logEvent(
      'SELECT_VISUAL_OBJECT',
      'SELECTION',
      this.lastSyncedRealityChecksum,
      this.lastSyncedRealityChecksum
    );
  }

  public hoverObject(visualObjectId: string | null): void {
    this.selectionState = SelectionVisualizationEngine.hoverVisualObject(
      visualObjectId,
      this.selectionState
    );
  }

  public setCameraPreset(preset: R7CameraState['viewPreset']): void {
    this.cameraState = CameraIsolationEngine.applyPreset(preset);
    this.causalityAuditor.logEvent(
      `CAMERA_PRESET_${preset}`,
      'CAMERA',
      this.lastSyncedRealityChecksum,
      this.lastSyncedRealityChecksum
    );
  }

  public adjustCameraZoom(delta: number): void {
    this.cameraState = CameraIsolationEngine.adjustZoom(this.cameraState, delta);
    this.causalityAuditor.logEvent(
      'CAMERA_ZOOM',
      'CAMERA',
      this.lastSyncedRealityChecksum,
      this.lastSyncedRealityChecksum
    );
  }

  public adjustCameraOrbit(angleDelta: number): void {
    this.cameraState = CameraIsolationEngine.adjustOrbit(this.cameraState, angleDelta);
    this.causalityAuditor.logEvent(
      'CAMERA_ORBIT',
      'CAMERA',
      this.lastSyncedRealityChecksum,
      this.lastSyncedRealityChecksum
    );
  }

  public toggleLayer(layer: keyof R7LayerToggles): void {
    this.layerToggles = Object.freeze({
      ...this.layerToggles,
      [layer]: !this.layerToggles[layer],
    });
    this.causalityAuditor.logEvent(
      `TOGGLE_LAYER_${String(layer)}`,
      'UI',
      this.lastSyncedRealityChecksum,
      this.lastSyncedRealityChecksum
    );
  }

  // ─── Upstream Reality Propagation ───

  public syncFromWorkspace(newWorkspaceState: WorkspaceState, seq = 0): void {
    const oldRealityChecksum = this.lastSyncedRealityChecksum;
    this.currentWorkspaceState = newWorkspaceState;
    this.lastSyncedRealityChecksum = newWorkspaceState.realityBinding.realityStateChecksum;

    this.currentSceneGraph = SceneGraphEngine.buildSceneGraph(
      newWorkspaceState,
      this.selectionState.selectedVisualObjectId,
      seq
    );

    this.causalityAuditor.logEvent(
      'SYNC_FROM_WORKSPACE',
      'VISUALIZATION',
      oldRealityChecksum,
      this.lastSyncedRealityChecksum
    );
  }

  // ─── Snapshots ───

  public createSnapshot(seq = 0): R7VisualizationSnapshot {
    const snap = VisualizationSnapshotEngine.createSnapshot(
      this.currentSceneGraph,
      this.lastSyncedRealityChecksum,
      this.currentWorkspaceState.workspaceChecksum,
      seq
    );

    this.causalityAuditor.logEvent(
      'CREATE_SNAPSHOT',
      'VISUALIZATION',
      this.lastSyncedRealityChecksum,
      this.lastSyncedRealityChecksum
    );

    return snap;
  }

  // ─── Validation ───

  public validate(): R7VisualizationValidationReport {
    return VisualizationValidator.validateSceneGraph(this.currentSceneGraph);
  }

  // ─── Execution Signature (sigma^2 = 0) ───

  public computeExecutionSignature(): R7VisualizationExecutionSignature {
    const syncStatus = this.getSyncStatus();
    const raw = JSON.stringify([
      this.lastSyncedRealityChecksum,
      this.currentWorkspaceState.workspaceChecksum,
      this.currentSceneGraph.sceneChecksum,
      this.currentSceneGraph.nodes.length,
      syncStatus,
    ]);
    const executionHash = `EXEC_R7_${deterministicHash(raw)}`;

    return Object.freeze({
      realityChecksum: this.lastSyncedRealityChecksum,
      workspaceChecksum: this.currentWorkspaceState.workspaceChecksum,
      sceneChecksum: this.currentSceneGraph.sceneChecksum,
      visualObjectCount: this.currentSceneGraph.nodes.length,
      syncStatus,
      executionHash,
    });
  }

  // ─── Causality ───

  public getCausalityAuditor(): R7CausalityAuditor {
    return this.causalityAuditor;
  }

  public getCausalityEvents(): readonly R7CausalityEvent[] {
    return this.causalityAuditor.getEvents();
  }
}
