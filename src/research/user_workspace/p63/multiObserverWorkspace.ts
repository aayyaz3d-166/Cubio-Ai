/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.3: Master Multi-Observer Workspace Controller
 *
 * Coordinates Reality X, Observer Set (O0, O1, O2), Frame Set (F0, F1, F2),
 * Constraint Intersections, Multi-Observer Reconstruction R, and Causality Audits.
 */

import {
  WorkspaceReality,
  WorkspaceObserver,
  WorkspaceObject,
  WorkspaceDimension,
} from '../p61/types';
import {
  createDefaultExperimentalReality,
  createEmptyReality,
  createCanonicalP5RealityCopy,
} from '../p61/realityBuilder';
import {
  P63ObserverSet,
  P63ObservableFrameSet,
  P63ReconstructionResult,
  ObserverKey,
  ObserverCombinationKey,
} from './types';
import {
  createDefaultObserverSet,
  mutateSingleObserver,
} from './observerSet';
import { MultiObservationSync } from './observationSync';
import { MultiObserverReconstructionBuilder } from './reconstruction';
import { CausalityAuditManager } from './causality';
import { RealityMutationEngine } from '../p62/realityMutation';
import { SelectionController } from '../p62/selectionController';
import { InteractionHistoryManager } from '../p62/interactionHistory';
import {
  updateObserverOrientation,
  updateObserverDistance,
  updateObserverPan,
  resetObserverState,
} from '../p61/observerController';

export class MultiObserverWorkspace {
  public reality: WorkspaceReality;
  public observers: P63ObserverSet;
  public activeViewObserverKey: ObserverKey = 'O0';
  public selectedCombination: ObserverCombinationKey = 'F0+F1';
  public readonly selection: SelectionController;
  public readonly causalityAudit: CausalityAuditManager;
  public readonly history: InteractionHistoryManager;

  constructor(
    initialReality?: WorkspaceReality,
    initialDimension: WorkspaceDimension = 2,
    initialSelectedId: string | null = 'P61_OBJ_A'
  ) {
    this.reality = initialReality || createDefaultExperimentalReality();
    this.observers = createDefaultObserverSet(initialDimension);
    this.activeViewObserverKey = 'O0';
    this.selectedCombination = 'F0+F1';
    this.selection = new SelectionController(initialSelectedId);
    this.causalityAudit = new CausalityAuditManager();
    this.history = new InteractionHistoryManager(this.reality, {
      selectedObjectId: initialSelectedId,
      multiSelectedIds: initialSelectedId ? [initialSelectedId] : [],
      selectionTimestamp: 0,
    });
  }

  /* ─── State Synchronization ─── */

  public getObservableFrames(): P63ObservableFrameSet {
    return MultiObservationSync.syncAllFrames(this.reality, this.observers);
  }

  public getReconstruction(): P63ReconstructionResult {
    const frames = this.getObservableFrames();
    return MultiObserverReconstructionBuilder.buildReconstruction(
      this.reality,
      frames,
      this.selectedCombination
    );
  }

  public getObserverChecksums(): [string, string, string] {
    return [
      this.observers.O0.observerChecksum,
      this.observers.O1.observerChecksum,
      this.observers.O2.observerChecksum,
    ];
  }

  public getFrameChecksums(): [string, string, string] {
    const frames = this.getObservableFrames();
    return [frames.f0Checksum, frames.f1Checksum, frames.f2Checksum];
  }

  /* ─── Reality Mutations ─── */

  public createObject(partial?: Partial<Omit<WorkspaceObject, 'id'>> & { id?: string }): string {
    const rBefore = this.reality.realityChecksum;
    const obsBefore = this.getObserverChecksums();
    const framesBefore = this.getFrameChecksums();

    const { updatedReality, createdObjectId } = RealityMutationEngine.createObject(this.reality, partial);
    this.reality = updatedReality;
    this.selection.select(createdObjectId, this.reality);

    const rAfter = this.reality.realityChecksum;
    const obsAfter = this.getObserverChecksums();
    const framesAfter = this.getFrameChecksums();
    const recon = this.getReconstruction();

    this.causalityAudit.recordEvent(
      'REALITY_MUTATION',
      `Created node ${createdObjectId}`,
      rBefore,
      rAfter,
      obsBefore,
      obsAfter,
      framesBefore,
      framesAfter,
      recon.accuracyScore
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

    const rBefore = this.reality.realityChecksum;
    const obsBefore = this.getObserverChecksums();
    const framesBefore = this.getFrameChecksums();

    this.reality = RealityMutationEngine.moveObject(this.reality, selectedId, newPosition);
    this.selection.select(selectedId, this.reality);

    const rAfter = this.reality.realityChecksum;
    const obsAfter = this.getObserverChecksums();
    const framesAfter = this.getFrameChecksums();
    const recon = this.getReconstruction();

    this.causalityAudit.recordEvent(
      'REALITY_MUTATION',
      `Moved ${selectedId} to [${newPosition.join(',')}]`,
      rBefore,
      rAfter,
      obsBefore,
      obsAfter,
      framesBefore,
      framesAfter,
      recon.accuracyScore
    );

    this.history.recordMutation(
      this.reality,
      {
        selectedObjectId: selectedId,
        multiSelectedIds: [selectedId],
        selectionTimestamp: 0,
      },
      `Moved ${selectedId}`
    );
  }

  public translateSelectedObject(delta: readonly [number, number, number]): void {
    const selected = this.getSelectedObject();
    if (!selected) return;

    const nextPos: [number, number, number] = [
      selected.position[0] + delta[0],
      selected.position[1] + delta[1],
      selected.position[2] + delta[2],
    ];
    this.moveSelectedObject(nextPos);
  }

  public duplicateSelectedObject(): string | null {
    const selectedId = this.selection.getState().selectedObjectId;
    if (!selectedId) return null;

    const rBefore = this.reality.realityChecksum;
    const obsBefore = this.getObserverChecksums();
    const framesBefore = this.getFrameChecksums();

    const { updatedReality, duplicatedObjectId } = RealityMutationEngine.duplicateObject(this.reality, selectedId);
    if (!duplicatedObjectId) return null;

    this.reality = updatedReality;
    this.selection.select(duplicatedObjectId, this.reality);

    const rAfter = this.reality.realityChecksum;
    const obsAfter = this.getObserverChecksums();
    const framesAfter = this.getFrameChecksums();
    const recon = this.getReconstruction();

    this.causalityAudit.recordEvent(
      'REALITY_MUTATION',
      `Duplicated ${selectedId} -> ${duplicatedObjectId}`,
      rBefore,
      rAfter,
      obsBefore,
      obsAfter,
      framesBefore,
      framesAfter,
      recon.accuracyScore
    );

    this.history.recordMutation(
      this.reality,
      {
        selectedObjectId: duplicatedObjectId,
        multiSelectedIds: [duplicatedObjectId],
        selectionTimestamp: 0,
      },
      `Duplicated ${selectedId}`
    );

    return duplicatedObjectId;
  }

  public deleteSelectedObject(): void {
    const selectedId = this.selection.getState().selectedObjectId;
    if (!selectedId) return;

    const rBefore = this.reality.realityChecksum;
    const obsBefore = this.getObserverChecksums();
    const framesBefore = this.getFrameChecksums();

    this.reality = RealityMutationEngine.deleteObject(this.reality, selectedId);
    this.selection.deselect();

    const rAfter = this.reality.realityChecksum;
    const obsAfter = this.getObserverChecksums();
    const framesAfter = this.getFrameChecksums();
    const recon = this.getReconstruction();

    this.causalityAudit.recordEvent(
      'REALITY_MUTATION',
      `Deleted ${selectedId}`,
      rBefore,
      rAfter,
      obsBefore,
      obsAfter,
      framesBefore,
      framesAfter,
      recon.accuracyScore
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
    const obsBefore = this.getObserverChecksums();
    const framesBefore = this.getFrameChecksums();

    this.reality = RealityMutationEngine.resetReality();
    this.selection.select('P61_OBJ_A', this.reality);

    const rAfter = this.reality.realityChecksum;
    const obsAfter = this.getObserverChecksums();
    const framesAfter = this.getFrameChecksums();
    const recon = this.getReconstruction();

    this.causalityAudit.recordEvent(
      'REALITY_MUTATION',
      'Reset Reality',
      rBefore,
      rAfter,
      obsBefore,
      obsAfter,
      framesBefore,
      framesAfter,
      recon.accuracyScore
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
    const obsBefore = this.getObserverChecksums();
    const framesBefore = this.getFrameChecksums();

    this.reality = RealityMutationEngine.loadCanonicalCopy();
    const firstId = this.reality.objects[0]?.id || null;
    if (firstId) this.selection.select(firstId, this.reality);

    const rAfter = this.reality.realityChecksum;
    const obsAfter = this.getObserverChecksums();
    const framesAfter = this.getFrameChecksums();
    const recon = this.getReconstruction();

    this.causalityAudit.recordEvent(
      'REALITY_MUTATION',
      'Loaded Canonical P5 Copy',
      rBefore,
      rAfter,
      obsBefore,
      obsAfter,
      framesBefore,
      framesAfter,
      recon.accuracyScore
    );

    this.history.recordMutation(
      this.reality,
      {
        selectedObjectId: firstId,
        multiSelectedIds: firstId ? [firstId] : [],
        selectionTimestamp: 0,
      },
      'Loaded Canonical P5 Copy'
    );
  }

  /* ─── Selection ─── */

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

  public mutateActiveObserver(mutation: (obs: WorkspaceObserver) => WorkspaceObserver): void {
    const rBefore = this.reality.realityChecksum;
    const obsBefore = this.getObserverChecksums();
    const framesBefore = this.getFrameChecksums();

    this.observers = mutateSingleObserver(this.observers, this.activeViewObserverKey, mutation);

    const rAfter = this.reality.realityChecksum;
    const obsAfter = this.getObserverChecksums();
    const framesAfter = this.getFrameChecksums();
    const recon = this.getReconstruction();

    this.causalityAudit.recordEvent(
      'OBSERVER_MUTATION',
      `Mutated ${this.activeViewObserverKey}`,
      rBefore,
      rAfter,
      obsBefore,
      obsAfter,
      framesBefore,
      framesAfter,
      recon.accuracyScore
    );
  }

  public orbitActiveObserver(deltaYaw: number, deltaPitch: number): void {
    this.mutateActiveObserver((obs) => updateObserverOrientation(obs, deltaYaw, deltaPitch));
  }

  public panActiveObserver(deltaX: number, deltaY: number): void {
    this.mutateActiveObserver((obs) => updateObserverPan(obs, deltaX, deltaY));
  }

  public zoomActiveObserver(deltaDistance: number): void {
    this.mutateActiveObserver((obs) => updateObserverDistance(obs, deltaDistance));
  }

  public resetActiveObserver(): void {
    this.mutateActiveObserver((obs) =>
      resetObserverState(obs.dimension, obs.viewportWidth, obs.viewportHeight)
    );
  }

  public setObserverCombination(combination: ObserverCombinationKey): void {
    this.selectedCombination = combination;
  }

  public setActiveViewObserver(key: ObserverKey): void {
    this.activeViewObserverKey = key;
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
