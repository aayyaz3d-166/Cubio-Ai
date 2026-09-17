/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.25-J: Central Workspace Geometry Scene Store
 *
 * Coordinates active space resolution, scene binding, object selection,
 * coordinate nudging, snapshot persistence, and causality enforcement.
 */

import {
  WorkspaceBoundGeometryScene,
  WorkspaceBoundGeometryObject,
  ViewportCameraState,
  SceneSnapshot3D,
  WorkspaceGeometryValidationReport,
} from './types';
import { SceneResolver } from './sceneResolver';
import { GeometryMutationBridge } from './geometryMutationBridge';
import { SelectionBindingLayer } from './selectionBinding';
import { ViewportStateManager } from './viewportState';
import { SceneValidator } from './sceneValidator';
import { WorkspaceCausalityEngine } from './causality';
import { generateDeterministicSnapshotId } from './determinism';
import { LiveSpaceState, WorkspaceUserContext } from '../p625i/types';

export class WorkspaceSceneStore {
  private userContext: WorkspaceUserContext;
  private activeSpaceId: string | null = null;
  private activeScene: WorkspaceBoundGeometryScene | null = null;
  private viewportManager: ViewportStateManager;
  private causalityEngine: WorkspaceCausalityEngine;
  private snapshots: Map<string, SceneSnapshot3D> = new Map();

  constructor(userContext: WorkspaceUserContext) {
    this.userContext = userContext;
    this.viewportManager = new ViewportStateManager();
    this.causalityEngine = new WorkspaceCausalityEngine();
  }

  public getContext(): WorkspaceUserContext {
    return this.userContext;
  }

  public getActiveSpaceId(): string | null {
    return this.activeSpaceId;
  }

  public getActiveScene(): WorkspaceBoundGeometryScene | null {
    return this.activeScene;
  }

  public getViewportManager(): ViewportStateManager {
    return this.viewportManager;
  }

  public getCausalityEngine(): WorkspaceCausalityEngine {
    return this.causalityEngine;
  }

  public bindSpace(space: LiveSpaceState): WorkspaceBoundGeometryScene | null {
    this.activeSpaceId = space.spaceId;
    this.activeScene = SceneResolver.resolveSceneForSpace(space, this.userContext);

    if (this.activeScene) {
      this.causalityEngine.auditEvent(
        'WORKSPACE',
        'SPACE_BOUND',
        space.spaceId,
        'CS_REALITY_CANONICAL_01',
        'CS_REALITY_CANONICAL_01',
        'CS_MODEL_CANONICAL_01',
        'CS_MODEL_CANONICAL_01',
        this.activeScene.sceneChecksum,
        this.activeScene.sceneChecksum
      );
      this.viewportManager.resetView(space.currentCoordinates);
    }

    return this.activeScene;
  }

  public switchSpace(targetSpace: LiveSpaceState): WorkspaceBoundGeometryScene | null {
    return this.bindSpace(targetSpace);
  }

  public selectObject(objectId: string | null): boolean {
    if (!this.activeScene) return false;

    const prevCS = this.activeScene.sceneChecksum;
    const { updatedScene, selectedObject } = SelectionBindingLayer.selectObject(this.activeScene, objectId);
    this.activeScene = updatedScene;
    SceneResolver.updateScene(updatedScene);

    this.causalityEngine.auditEvent(
      'SELECTION',
      'OBJECT_SELECTED',
      this.activeScene.spaceId,
      'CS_REALITY_CANONICAL_01',
      'CS_REALITY_CANONICAL_01',
      'CS_MODEL_CANONICAL_01',
      'CS_MODEL_CANONICAL_01',
      prevCS,
      updatedScene.sceneChecksum,
      objectId ?? undefined
    );

    return true;
  }

  public nudgeSelectedObject(axis: 'X' | 'Y' | 'Z', delta: number): boolean {
    if (!this.activeScene || !this.activeScene.selectedObjectId) {
      return false;
    }

    const prevCS = this.activeScene.sceneChecksum;
    const targetObjId = this.activeScene.selectedObjectId;

    const { updatedScene, mutatedObject } = GeometryMutationBridge.nudgeObjectCoordinates(
      this.activeScene,
      targetObjId,
      axis,
      delta
    );

    this.activeScene = updatedScene;
    SceneResolver.updateScene(updatedScene);

    this.causalityEngine.auditEvent(
      'GEOMETRY',
      `NUDGE_${axis}`,
      this.activeScene.spaceId,
      'CS_REALITY_CANONICAL_01',
      'CS_REALITY_CANONICAL_01',
      'CS_MODEL_CANONICAL_01',
      'CS_MODEL_CANONICAL_01',
      prevCS,
      updatedScene.sceneChecksum,
      targetObjId
    );

    return true;
  }

  public saveSceneSnapshot(stateName: string): SceneSnapshot3D | null {
    if (!this.activeScene) return null;

    const snapshotId = generateDeterministicSnapshotId(this.activeScene.spaceId, stateName);
    const cameraState = this.viewportManager.getCameraState();
    const snapshot: SceneSnapshot3D = Object.freeze({
      snapshotId,
      spaceId: this.activeScene.spaceId,
      sceneId: this.activeScene.sceneId,
      stateName,
      sceneData: this.activeScene,
      cameraState,
      snapshotChecksum: this.activeScene.sceneChecksum,
      timestamp: Date.now(),
    });

    this.snapshots.set(snapshotId, snapshot);
    return snapshot;
  }

  public restoreSceneSnapshot(snapshotId: string): boolean {
    const snap = this.snapshots.get(snapshotId);
    if (!snap) return false;

    this.activeScene = snap.sceneData;
    SceneResolver.updateScene(snap.sceneData);
    this.viewportManager.resetView(snap.sceneData.objects[0]?.coordinates);
    return true;
  }

  public resetSpaceScene(space: LiveSpaceState): WorkspaceBoundGeometryScene | null {
    if (!space || space.isDeleted) return null;

    SceneResolver.removeSceneForSpace(space.spaceId);
    return this.bindSpace(space);
  }

  public validateActiveScene(): WorkspaceGeometryValidationReport {
    return SceneValidator.validateScene(
      this.activeScene,
      this.activeSpaceId ?? undefined,
      this.userContext.userId
    );
  }
}
