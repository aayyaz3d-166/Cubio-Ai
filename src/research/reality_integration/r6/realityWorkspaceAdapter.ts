/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R6: Reality -> Workspace Master Adapter (Facade)
 *
 * Coordinates live synchronization, object/spatial bindings, camera manipulation,
 * selection binding, diffing, validation, causality auditing, and execution signatures.
 *
 * Invariant: Unidirectional causality.
 * Workspace, UI, Camera, and Selection never mutate authoritative Reality (Delta Reality = 0).
 */

import { RealityState } from '../r2/types';
import { RealityObject, RealityRelationship } from '../r4/types';
import { SpatialRelation, SpatialTopologyGraph } from '../r5/types';
import {
  WorkspaceState,
  WorkspaceCameraState,
  WorkspaceSelectionState,
  WorkspaceObjectBinding,
  WorkspaceRelationshipBinding,
  WorkspaceSpatialBinding,
  WorkspaceTopologyBinding,
  WorkspaceSnapshot,
  WorkspaceValidationReport,
  WorkspaceDiff,
  WorkspaceExecutionSignature,
  WorkspaceSyncStatus,
} from './types';
import { WorkspaceRealityStateEngine } from './workspaceRealityState';
import { WorkspaceStateSyncEngine } from './workspaceStateSync';
import { WorkspaceObjectBindingEngine } from './workspaceObjectBinding';
import { WorkspaceRelationshipBindingEngine } from './workspaceRelationshipBinding';
import { WorkspaceSpatialBindingEngine } from './workspaceSpatialBinding';
import { WorkspaceSelectionBindingEngine } from './workspaceSelectionBinding';
import { WorkspaceDiffEngine } from './workspaceDiff';
import { WorkspaceSnapshotEngine } from './workspaceSnapshot';
import { WorkspaceValidator } from './workspaceValidator';
import { WorkspaceCausalityAuditor, R6CausalityEvent } from './causality';
import { deterministicHash } from './determinism';

export class RealityWorkspaceAdapter {
  private currentState: WorkspaceState;
  private causalityAuditor: WorkspaceCausalityAuditor;
  private currentRealityState: RealityState;

  constructor(
    initialRealityState: RealityState,
    initialObjects: readonly RealityObject[] = [],
    initialRelationships: readonly RealityRelationship[] = [],
    initialSpatialRelations: readonly SpatialRelation[] = [],
    initialTopology: SpatialTopologyGraph | null = null,
    seq = 0
  ) {
    this.currentRealityState = initialRealityState;
    this.causalityAuditor = new WorkspaceCausalityAuditor();

    const boundObjects = WorkspaceObjectBindingEngine.bindObjects(initialObjects);
    const boundRelationships = WorkspaceRelationshipBindingEngine.bindRelationships(initialRelationships);
    const boundSpatial = WorkspaceSpatialBindingEngine.bindSpatialRelations(initialSpatialRelations);
    const boundTopology = WorkspaceSpatialBindingEngine.bindTopology(initialTopology);

    const realityId = (initialRealityState as any).realityId ?? 'REALITY_CANONICAL_ROOT';

    this.currentState = WorkspaceRealityStateEngine.createWorkspaceState(
      realityId,
      initialRealityState.stateId,
      initialRealityState.checksum,
      boundObjects,
      boundRelationships,
      boundSpatial,
      boundTopology,
      WorkspaceSelectionBindingEngine.createEmptySelection(),
      WorkspaceRealityStateEngine.DEFAULT_CAMERA,
      Object.freeze({}),
      1,
      seq
    );

    this.causalityAuditor.logEvent(
      'INITIALIZE_WORKSPACE',
      'WORKSPACE',
      initialRealityState.checksum,
      initialRealityState.checksum
    );
  }

  // ─── State Access ───

  public getState(): WorkspaceState {
    return this.currentState;
  }

  public getRealityState(): RealityState {
    return this.currentRealityState;
  }

  // ─── Synchronization ───

  public syncFromReality(
    newRealityState: RealityState,
    objects: readonly RealityObject[],
    relationships: readonly RealityRelationship[] = [],
    spatialRelations: readonly SpatialRelation[] = [],
    topology: SpatialTopologyGraph | null = null
  ): WorkspaceState {
    const oldRealityChecksum = this.currentRealityState.checksum;
    this.currentRealityState = newRealityState;

    this.currentState = WorkspaceStateSyncEngine.resynchronize(
      this.currentState,
      newRealityState,
      objects,
      relationships,
      spatialRelations,
      topology
    );

    this.causalityAuditor.logEvent(
      'PROPAGATE_REALITY_MUTATION',
      'REALITY',
      oldRealityChecksum,
      newRealityState.checksum
    );

    return this.currentState;
  }

  public checkSyncStatus(): WorkspaceSyncStatus {
    return WorkspaceStateSyncEngine.evaluateSyncStatus(
      this.currentState,
      this.currentRealityState
    );
  }

  // ─── Workspace-Only Mutations (Delta Reality = 0) ───

  public setCamera(camera: Partial<WorkspaceCameraState>): WorkspaceState {
    const newCamera: WorkspaceCameraState = Object.freeze({
      position: camera.position ?? this.currentState.camera.position,
      target: camera.target ?? this.currentState.camera.target,
      zoom: camera.zoom ?? this.currentState.camera.zoom,
      orbitAngle: camera.orbitAngle ?? this.currentState.camera.orbitAngle,
      isOrtho: camera.isOrtho ?? this.currentState.camera.isOrtho,
    });

    this.currentState = WorkspaceRealityStateEngine.createWorkspaceState(
      this.currentState.realityBinding.realityId,
      this.currentState.realityBinding.realityStateId,
      this.currentState.realityBinding.realityStateChecksum,
      this.currentState.objects,
      this.currentState.relationships,
      this.currentState.spatialRelations,
      this.currentState.topology,
      this.currentState.selection,
      newCamera,
      this.currentState.uiPanels,
      this.currentState.version + 1
    );

    this.causalityAuditor.logEvent(
      'UPDATE_CAMERA',
      'CAMERA',
      this.currentRealityState.checksum,
      this.currentRealityState.checksum
    );

    return this.currentState;
  }

  public selectObject(workspaceObjectId: string | null): WorkspaceState {
    let selection: WorkspaceSelectionState = WorkspaceSelectionBindingEngine.createEmptySelection();

    if (workspaceObjectId) {
      const obj = this.currentState.objects.find((o) => o.workspaceObjectId === workspaceObjectId);
      if (obj) {
        selection = WorkspaceSelectionBindingEngine.selectObject(obj);
      }
    }

    this.currentState = WorkspaceRealityStateEngine.createWorkspaceState(
      this.currentState.realityBinding.realityId,
      this.currentState.realityBinding.realityStateId,
      this.currentState.realityBinding.realityStateChecksum,
      this.currentState.objects,
      this.currentState.relationships,
      this.currentState.spatialRelations,
      this.currentState.topology,
      selection,
      this.currentState.camera,
      this.currentState.uiPanels,
      this.currentState.version + 1
    );

    this.causalityAuditor.logEvent(
      'UPDATE_SELECTION',
      'SELECTION',
      this.currentRealityState.checksum,
      this.currentRealityState.checksum
    );

    return this.currentState;
  }

  public selectRelationship(workspaceRelId: string | null): WorkspaceState {
    let selection: WorkspaceSelectionState = WorkspaceSelectionBindingEngine.createEmptySelection();

    if (workspaceRelId) {
      const rel = this.currentState.relationships.find((r) => r.workspaceRelationshipId === workspaceRelId);
      if (rel) {
        selection = WorkspaceSelectionBindingEngine.selectRelationship(rel);
      }
    }

    this.currentState = WorkspaceRealityStateEngine.createWorkspaceState(
      this.currentState.realityBinding.realityId,
      this.currentState.realityBinding.realityStateId,
      this.currentState.realityBinding.realityStateChecksum,
      this.currentState.objects,
      this.currentState.relationships,
      this.currentState.spatialRelations,
      this.currentState.topology,
      selection,
      this.currentState.camera,
      this.currentState.uiPanels,
      this.currentState.version + 1
    );

    this.causalityAuditor.logEvent(
      'UPDATE_SELECTION_RELATIONSHIP',
      'SELECTION',
      this.currentRealityState.checksum,
      this.currentRealityState.checksum
    );

    return this.currentState;
  }

  public selectSpatialRelation(workspaceSpatialId: string | null): WorkspaceState {
    let selection: WorkspaceSelectionState = WorkspaceSelectionBindingEngine.createEmptySelection();

    if (workspaceSpatialId) {
      const sp = this.currentState.spatialRelations.find((s) => s.workspaceSpatialId === workspaceSpatialId);
      if (sp) {
        selection = WorkspaceSelectionBindingEngine.selectSpatialRelation(sp);
      }
    }

    this.currentState = WorkspaceRealityStateEngine.createWorkspaceState(
      this.currentState.realityBinding.realityId,
      this.currentState.realityBinding.realityStateId,
      this.currentState.realityBinding.realityStateChecksum,
      this.currentState.objects,
      this.currentState.relationships,
      this.currentState.spatialRelations,
      this.currentState.topology,
      selection,
      this.currentState.camera,
      this.currentState.uiPanels,
      this.currentState.version + 1
    );

    this.causalityAuditor.logEvent(
      'UPDATE_SELECTION_SPATIAL',
      'SELECTION',
      this.currentRealityState.checksum,
      this.currentRealityState.checksum
    );

    return this.currentState;
  }

  // ─── Diffing & Validation ───

  public diff(otherWorkspaceState: WorkspaceState): WorkspaceDiff {
    return WorkspaceDiffEngine.compareWorkspaces(this.currentState, otherWorkspaceState);
  }

  public validate(): WorkspaceValidationReport {
    return WorkspaceValidator.validateWorkspace(this.currentState);
  }

  // ─── Snapshots ───

  public createSnapshot(seq = 0): WorkspaceSnapshot {
    const snap = WorkspaceSnapshotEngine.createSnapshot(this.currentState, seq);
    this.causalityAuditor.logEvent(
      'CREATE_SNAPSHOT',
      'WORKSPACE',
      this.currentRealityState.checksum,
      this.currentRealityState.checksum
    );
    return snap;
  }

  // ─── Execution Signature (sigma^2 = 0) ───

  public computeExecutionSignature(): WorkspaceExecutionSignature {
    const raw = JSON.stringify([
      this.currentRealityState.checksum,
      this.currentState.workspaceChecksum,
      this.currentState.objects.length,
      this.currentState.relationships.length,
      this.currentState.spatialRelations.length,
      this.currentState.realityBinding.syncStatus,
    ]);
    const executionHash = `EXEC_R6_${deterministicHash(raw)}`;

    return Object.freeze({
      realityChecksum: this.currentRealityState.checksum,
      workspaceChecksum: this.currentState.workspaceChecksum,
      objectCount: this.currentState.objects.length,
      relationCount: this.currentState.relationships.length,
      spatialCount: this.currentState.spatialRelations.length,
      syncStatus: this.currentState.realityBinding.syncStatus,
      executionHash,
    });
  }

  // ─── Causality ───

  public getCausalityAuditor(): WorkspaceCausalityAuditor {
    return this.causalityAuditor;
  }

  public getCausalityEvents(): readonly R6CausalityEvent[] {
    return this.causalityAuditor.getEvents();
  }
}
