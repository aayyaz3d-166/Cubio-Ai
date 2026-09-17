/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.2: Master Interactive Reality Engine
 *
 * Coordinates interactive reality editing, independent observer controls,
 * synchronized observation/reconstruction pipelines, and mutation audit logs.
 */

import {
  WorkspaceReality,
  WorkspaceObserver,
  WorkspaceDimension,
  WorkspaceObject,
} from '../p61/types';
import {
  createDefaultExperimentalReality,
  createEmptyReality,
  createCanonicalP5RealityCopy,
} from '../p61/realityBuilder';
import {
  createDefaultWorkspaceObserver,
  updateObserverOrientation,
  updateObserverDistance,
  updateObserverPan,
  setObserverDimension,
  resetObserverState,
} from '../p61/observerController';
import {
  InteractiveSelectionState,
  SynchronizedPipelineOutput,
  RealityMutationRecord,
  MultiObserverSelectionConfig,
} from './types';
import { RealityMutationEngine } from './realityMutation';
import { SelectionController } from './selectionController';
import { TransformController } from './transformController';
import { ObservationSyncEngine } from './observationSync';
import { ReconstructionSyncEngine } from './reconstructionSync';
import { MutationAuditLogger } from './mutationAudit';
import { InteractionHistoryManager } from './interactionHistory';

export class InteractiveRealityEngine {
  public reality: WorkspaceReality;
  public observer: WorkspaceObserver;
  public readonly selection: SelectionController;
  public readonly auditLogger: MutationAuditLogger;
  public readonly history: InteractionHistoryManager;
  public multiObserverConfig: MultiObserverSelectionConfig;

  constructor(
    initialReality?: WorkspaceReality,
    initialObserver?: WorkspaceObserver,
    initialSelectedId: string | null = 'P61_OBJ_A'
  ) {
    this.reality = initialReality || createDefaultExperimentalReality();
    this.observer = initialObserver || createDefaultWorkspaceObserver();
    this.selection = new SelectionController(initialSelectedId);
    this.auditLogger = new MutationAuditLogger();
    this.history = new InteractionHistoryManager(
      this.reality,
      {
        selectedObjectId: initialSelectedId,
        multiSelectedIds: initialSelectedId ? [initialSelectedId] : [],
        selectionTimestamp: 0,
      }
    );
    this.multiObserverConfig = {
      activeObserverKeys: ['O0', 'O1'],
      combinationKey: 'F0+F1',
    };
  }

  /* ─── Synchronized Output Accessor ─── */

  public getSynchronizedPipeline(): SynchronizedPipelineOutput {
    const { observableFrame } = ObservationSyncEngine.syncObservableFrame(
      this.reality,
      this.observer
    );
    const reconstruction = ReconstructionSyncEngine.syncReconstruction(
      this.reality,
      this.observer,
      observableFrame
    );

    return Object.freeze({
      reality: this.reality,
      observer: this.observer,
      observableFrame,
      reconstruction,
      realityChecksum: this.reality.realityChecksum,
      observerChecksum: this.observer.observerChecksum,
      frameChecksum: observableFrame.frameChecksum,
      isExactReconstruction: reconstruction.isExact,
      informationLoss: reconstruction.informationLoss,
    });
  }

  /* ─── Reality Mutations ─── */

  public createObject(partial?: Partial<Omit<WorkspaceObject, 'id'>> & { id?: string }): string {
    const rBefore = this.reality.realityChecksum;
    const fBefore = this.getSynchronizedPipeline().frameChecksum;

    const { updatedReality, createdObjectId } = RealityMutationEngine.createObject(this.reality, partial);
    this.reality = updatedReality;
    this.selection.select(createdObjectId, this.reality);

    const rAfter = this.reality.realityChecksum;
    const fAfter = this.getSynchronizedPipeline().frameChecksum;

    this.auditLogger.logMutation(
      'CREATE',
      createdObjectId,
      null,
      this.getSelectedObject()?.position || null,
      rBefore,
      rAfter,
      fBefore,
      fAfter,
      this.observer.observerChecksum
    );

    this.history.recordMutation(
      this.reality,
      {
        selectedObjectId: createdObjectId,
        multiSelectedIds: [createdObjectId],
        selectionTimestamp: 0,
      },
      `Created ${createdObjectId}`
    );

    return createdObjectId;
  }

  public moveSelectedObject(newPosition: readonly [number, number, number]): void {
    const selectedId = this.selection.getState().selectedObjectId;
    if (!selectedId) return;

    const targetObj = this.reality.objects.find((o) => o.id === selectedId);
    if (!targetObj) return;

    const oldPos = targetObj.position;
    const rBefore = this.reality.realityChecksum;
    const fBefore = this.getSynchronizedPipeline().frameChecksum;

    this.reality = RealityMutationEngine.moveObject(this.reality, selectedId, newPosition);
    this.selection.select(selectedId, this.reality);

    const rAfter = this.reality.realityChecksum;
    const fAfter = this.getSynchronizedPipeline().frameChecksum;

    this.auditLogger.logMutation(
      'MOVE',
      selectedId,
      oldPos,
      newPosition,
      rBefore,
      rAfter,
      fBefore,
      fAfter,
      this.observer.observerChecksum
    );

    this.history.recordMutation(
      this.reality,
      {
        selectedObjectId: selectedId,
        multiSelectedIds: [selectedId],
        selectionTimestamp: 0,
      },
      `Moved ${selectedId} to [${newPosition.join(',')}]`
    );
  }

  public translateSelectedObject(delta: readonly [number, number, number]): void {
    const selectedId = this.selection.getState().selectedObjectId;
    if (!selectedId) return;

    const targetObj = this.reality.objects.find((o) => o.id === selectedId);
    if (!targetObj) return;

    const newPos: [number, number, number] = [
      targetObj.position[0] + delta[0],
      targetObj.position[1] + delta[1],
      targetObj.position[2] + delta[2],
    ];

    this.moveSelectedObject(newPos);
  }

  public duplicateSelectedObject(): string | null {
    const selectedId = this.selection.getState().selectedObjectId;
    if (!selectedId) return null;

    const rBefore = this.reality.realityChecksum;
    const fBefore = this.getSynchronizedPipeline().frameChecksum;

    const { updatedReality, duplicatedObjectId } = RealityMutationEngine.duplicateObject(
      this.reality,
      selectedId
    );
    if (!duplicatedObjectId) return null;

    this.reality = updatedReality;
    this.selection.select(duplicatedObjectId, this.reality);

    const rAfter = this.reality.realityChecksum;
    const fAfter = this.getSynchronizedPipeline().frameChecksum;

    this.auditLogger.logMutation(
      'DUPLICATE',
      duplicatedObjectId,
      null,
      this.getSelectedObject()?.position || null,
      rBefore,
      rAfter,
      fBefore,
      fAfter,
      this.observer.observerChecksum
    );

    this.history.recordMutation(
      this.reality,
      {
        selectedObjectId: duplicatedObjectId,
        multiSelectedIds: [duplicatedObjectId],
        selectionTimestamp: 0,
      },
      `Duplicated ${selectedId} -> ${duplicatedObjectId}`
    );

    return duplicatedObjectId;
  }

  public deleteSelectedObject(): void {
    const selectedId = this.selection.getState().selectedObjectId;
    if (!selectedId) return;

    const targetObj = this.reality.objects.find((o) => o.id === selectedId);
    const oldPos = targetObj ? targetObj.position : null;

    const rBefore = this.reality.realityChecksum;
    const fBefore = this.getSynchronizedPipeline().frameChecksum;

    this.reality = RealityMutationEngine.deleteObject(this.reality, selectedId);
    this.selection.deselect();

    const rAfter = this.reality.realityChecksum;
    const fAfter = this.getSynchronizedPipeline().frameChecksum;

    this.auditLogger.logMutation(
      'DELETE',
      selectedId,
      oldPos,
      null,
      rBefore,
      rAfter,
      fBefore,
      fAfter,
      this.observer.observerChecksum
    );

    this.history.recordMutation(
      this.reality,
      {
        selectedObjectId: null,
        multiSelectedIds: [],
        selectionTimestamp: 0,
      },
      `Deleted ${selectedId}`
    );
  }

  public resetReality(): void {
    const rBefore = this.reality.realityChecksum;
    const fBefore = this.getSynchronizedPipeline().frameChecksum;

    this.reality = RealityMutationEngine.resetReality();
    this.selection.select('P61_OBJ_A', this.reality);

    const rAfter = this.reality.realityChecksum;
    const fAfter = this.getSynchronizedPipeline().frameChecksum;

    this.auditLogger.logMutation(
      'RESET_REALITY',
      null,
      null,
      null,
      rBefore,
      rAfter,
      fBefore,
      fAfter,
      this.observer.observerChecksum
    );

    this.history.recordMutation(
      this.reality,
      {
        selectedObjectId: 'P61_OBJ_A',
        multiSelectedIds: ['P61_OBJ_A'],
        selectionTimestamp: 0,
      },
      'Reset Reality'
    );
  }

  public loadCanonicalP5Reality(): void {
    const rBefore = this.reality.realityChecksum;
    const fBefore = this.getSynchronizedPipeline().frameChecksum;

    this.reality = RealityMutationEngine.loadCanonicalCopy();
    const firstId = this.reality.objects[0]?.id || null;
    if (firstId) this.selection.select(firstId, this.reality);

    const rAfter = this.reality.realityChecksum;
    const fAfter = this.getSynchronizedPipeline().frameChecksum;

    this.auditLogger.logMutation(
      'IMPORT',
      null,
      null,
      null,
      rBefore,
      rAfter,
      fBefore,
      fAfter,
      this.observer.observerChecksum
    );

    this.history.recordMutation(
      this.reality,
      {
        selectedObjectId: firstId,
        multiSelectedIds: firstId ? [firstId] : [],
        selectionTimestamp: 0,
      },
      'Loaded Canonical P5 Reality'
    );
  }

  /* ─── Selection Manipulations ─── */

  public selectObject(objectId: string | null): void {
    if (objectId) {
      this.selection.select(objectId, this.reality);
    } else {
      this.selection.deselect();
    }
  }

  public getSelectedObject(): WorkspaceObject | null {
    const id = this.selection.getState().selectedObjectId;
    if (!id) return null;
    return this.reality.objects.find((o) => o.id === id) || null;
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
  }

  public resetObserver(): void {
    this.observer = resetObserverState(
      this.observer.dimension,
      this.observer.viewportWidth,
      this.observer.viewportHeight
    );
  }

  /* ─── Multi-Observer Configuration ─── */

  public setMultiObserverCombination(comb: 'F0' | 'F0+F1' | 'F0+F2' | 'F1+F2' | 'F0+F1+F2'): void {
    let keys: ('O0' | 'O1' | 'O2')[] = ['O0'];
    if (comb === 'F0+F1') keys = ['O0', 'O1'];
    else if (comb === 'F0+F2') keys = ['O0', 'O2'];
    else if (comb === 'F1+F2') keys = ['O1', 'O2'];
    else if (comb === 'F0+F1+F2') keys = ['O0', 'O1', 'O2'];

    this.multiObserverConfig = {
      combinationKey: comb,
      activeObserverKeys: Object.freeze(keys),
    };
  }

  public getMultiObserverReconstruction() {
    return ReconstructionSyncEngine.syncMultiObserverReconstruction(
      this.reality,
      this.observer.dimension,
      this.multiObserverConfig.combinationKey
    );
  }

  /* ─── Undo / Redo ─── */

  public undo(): boolean {
    const restored = this.history.undo();
    if (!restored) return false;

    this.reality = restored.reality;
    this.selection.select(restored.selection.selectedObjectId || '', this.reality);
    this.selection.pruneSelection(this.reality);
    return true;
  }

  public redo(): boolean {
    const restored = this.history.redo();
    if (!restored) return false;

    this.reality = restored.reality;
    this.selection.select(restored.selection.selectedObjectId || '', this.reality);
    this.selection.pruneSelection(this.reality);
    return true;
  }
}
