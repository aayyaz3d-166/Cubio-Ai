/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.1: Workspace State Manager
 *
 * Coordinates WorkspaceReality, WorkspaceObserver, WorkspaceSelection,
 * History, Snapshots, and Observation Bridge.
 */

import {
  WorkspaceReality,
  WorkspaceObserver,
  WorkspaceSelection,
  WorkspaceStatus,
  WorkspaceObject,
  WorkspaceDimension,
} from './types';
import {
  createDefaultExperimentalReality,
  createEmptyReality,
  createCanonicalP5RealityCopy,
  addObjectToReality,
  removeObjectFromReality,
  moveObjectInReality,
  updateObjectInReality,
  duplicateObjectInReality,
  simpleHash,
} from './realityBuilder';
import {
  createDefaultWorkspaceObserver,
  updateObserverOrientation,
  updateObserverDistance,
  updateObserverPan,
  setObserverDimension,
  resetObserverState,
} from './observerController';
import { WorkspaceHistoryManager } from './history';
import { createWorkspaceSnapshot } from './snapshot';
import { exportWorkspaceToJson, importWorkspaceFromJson } from './exportImport';
import { generateWorkspaceObservation, WorkspaceObservationResult } from './observationBridge';

export class WorkspaceManager {
  public reality: WorkspaceReality;
  public observer: WorkspaceObserver;
  public selection: WorkspaceSelection;
  public readonly history: WorkspaceHistoryManager;

  constructor(initialReality?: WorkspaceReality, initialObserver?: WorkspaceObserver) {
    this.reality = initialReality || createDefaultExperimentalReality();
    this.observer = initialObserver || createDefaultWorkspaceObserver();
    this.selection = {
      selectedObjectId: 'P61_OBJ_A',
      multiSelectedIds: ['P61_OBJ_A'],
      selectionTimestamp: Date.now(),
    };
    this.history = new WorkspaceHistoryManager();
    this.history.record('RESET_REALITY', 'Initial workspace setup', this.reality, this.observer, this.selection);
  }

  /* ─── State Inspection & Checksums ─── */

  public getWorkspaceChecksum(): string {
    return simpleHash(this.reality.realityChecksum + this.observer.observerChecksum);
  }

  public getStatus(): WorkspaceStatus {
    return Object.freeze({
      totalObjects: this.reality.objects.length,
      selectedCount: this.selection.selectedObjectId ? 1 : 0,
      activeDimension: this.observer.dimension,
      realityChecksum: this.reality.realityChecksum,
      observerChecksum: this.observer.observerChecksum,
      workspaceChecksum: this.getWorkspaceChecksum(),
      isDirty: this.history.getHistoryLength() > 1,
      canUndo: this.history.canUndo(),
      canRedo: this.history.canRedo(),
    });
  }

  public getSelectedObject(): WorkspaceObject | null {
    if (!this.selection.selectedObjectId) return null;
    return this.reality.objects.find((o) => o.id === this.selection.selectedObjectId) || null;
  }

  /* ─── Reality Manipulations ─── */

  public addObject(object: Omit<WorkspaceObject, 'id'> & { id?: string }): void {
    this.reality = addObjectToReality(this.reality, object);
    const addedId = object.id || this.reality.objects[this.reality.objects.length - 1].id;
    this.selectObject(addedId);
    this.history.record('ADD_OBJECT', `Added object ${addedId}`, this.reality, this.observer, this.selection);
  }

  public removeObject(objectId: string): void {
    this.reality = removeObjectFromReality(this.reality, objectId);
    if (this.selection.selectedObjectId === objectId) {
      this.deselect();
    }
    this.history.record('REMOVE_OBJECT', `Removed object ${objectId}`, this.reality, this.observer, this.selection);
  }

  public moveObject(objectId: string, newPosition: readonly [number, number, number]): void {
    this.reality = moveObjectInReality(this.reality, objectId, newPosition);
    this.history.record('MOVE_OBJECT', `Moved object ${objectId} to [${newPosition.join(',')}]`, this.reality, this.observer, this.selection);
  }

  public updateObject(objectId: string, updates: Partial<Omit<WorkspaceObject, 'id'>>): void {
    this.reality = updateObjectInReality(this.reality, objectId, updates);
    this.history.record('UPDATE_OBJECT', `Updated object ${objectId}`, this.reality, this.observer, this.selection);
  }

  public duplicateObject(objectId: string): void {
    const prevCount = this.reality.objects.length;
    this.reality = duplicateObjectInReality(this.reality, objectId);
    if (this.reality.objects.length > prevCount) {
      const dupId = this.reality.objects[this.reality.objects.length - 1].id;
      this.selectObject(dupId);
      this.history.record('DUPLICATE_OBJECT', `Duplicated object ${objectId} -> ${dupId}`, this.reality, this.observer, this.selection);
    }
  }

  public loadCanonicalP5Reality(): void {
    this.reality = createCanonicalP5RealityCopy();
    this.selectObject(this.reality.objects[0]?.id || null);
    this.history.record('LOAD_CANONICAL', 'Loaded isolated copy of canonical P5 reality', this.reality, this.observer, this.selection);
  }

  public clearReality(): void {
    this.reality = createEmptyReality();
    this.deselect();
    this.history.record('RESET_REALITY', 'Cleared all reality objects', this.reality, this.observer, this.selection);
  }

  public resetToDefaultReality(): void {
    this.reality = createDefaultExperimentalReality();
    this.selectObject('P61_OBJ_A');
    this.history.record('RESET_REALITY', 'Reset to default 4-node experimental reality', this.reality, this.observer, this.selection);
  }

  /* ─── Selection ─── */

  public selectObject(objectId: string | null): void {
    this.selection = Object.freeze({
      selectedObjectId: objectId,
      multiSelectedIds: objectId ? [objectId] : [],
      selectionTimestamp: Date.now(),
    });
  }

  public deselect(): void {
    this.selectObject(null);
  }

  /* ─── Observer Manipulations ─── */

  public orbit(deltaYaw: number, deltaPitch: number): void {
    this.observer = updateObserverOrientation(this.observer, deltaYaw, deltaPitch);
  }

  public pan(deltaX: number, deltaY: number): void {
    this.observer = updateObserverPan(this.observer, deltaX, deltaY);
  }

  public zoom(deltaDistance: number): void {
    this.observer = updateObserverDistance(this.observer, deltaDistance);
  }

  public setDimension(dimension: WorkspaceDimension): void {
    this.observer = setObserverDimension(this.observer, dimension);
    this.history.record('CHANGE_DIMENSION', `Set dimension to Z${dimension}`, this.reality, this.observer, this.selection);
  }

  public resetObserver(): void {
    this.observer = resetObserverState(this.observer.dimension, this.observer.viewportWidth, this.observer.viewportHeight);
    this.history.record('RESET_OBSERVER', 'Reset observer position and target', this.reality, this.observer, this.selection);
  }

  /* ─── History (Undo / Redo) ─── */

  public undo(): boolean {
    const restored = this.history.undo();
    if (!restored) return false;

    this.reality = restored.realitySnapshot;
    this.observer = restored.observerSnapshot;
    this.selection = restored.selectionSnapshot;
    return true;
  }

  public redo(): boolean {
    const restored = this.history.redo();
    if (!restored) return false;

    this.reality = restored.realitySnapshot;
    this.observer = restored.observerSnapshot;
    this.selection = restored.selectionSnapshot;
    return true;
  }

  /* ─── Snapshot Operations ─── */

  public createSnapshot(label = 'Manual Snapshot') {
    return createWorkspaceSnapshot(label, this.reality, this.observer, this.selection);
  }

  public restoreSnapshot(snapshot: ReturnType<typeof createWorkspaceSnapshot>): void {
    this.reality = snapshot.reality;
    this.observer = snapshot.observer;
    this.selection = snapshot.selection;
    this.history.record('RESTORE_SNAPSHOT', `Restored snapshot ${snapshot.label}`, this.reality, this.observer, this.selection);
  }

  /* ─── Export / Import ─── */

  public exportJson(): string {
    const data = exportWorkspaceToJson(this.reality, this.observer);
    return JSON.stringify(data, null, 2);
  }

  public importJson(json: string): void {
    const { reality, observer } = importWorkspaceFromJson(json);
    this.reality = reality;
    this.observer = observer;
    this.selectObject(reality.objects[0]?.id || null);
    this.history.record('IMPORT_WORKSPACE', 'Imported workspace from JSON', this.reality, this.observer, this.selection);
  }

  /* ─── Observation & Reconstruction Execution ─── */

  public observe(): WorkspaceObservationResult {
    return generateWorkspaceObservation(this.reality, this.observer);
  }
}
