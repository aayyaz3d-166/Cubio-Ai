/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R8: Master Interaction Engine
 *
 * Orchestrates session lifecycle, object targeting, selection, transform preview/commit,
 * undo/redo, and interaction reset. Every operation receives deterministic IDs and provenance.
 * ΔReality = 0 for all operations.
 */

import {
  RealityInteractionSession,
  InteractionTarget,
  InteractionSelection,
  InteractionState,
  WorkspaceTransform,
  TransformPreview,
  TransformCommit,
  InteractionProvenance,
  InteractionHistoryEntry,
  InteractionSnapshot,
  InteractionExecutionSignature,
  InteractionBindingState,
  InteractionStaleState,
  InteractionValidationReport,
} from './types';
import { R7InteractionReader } from './r7Adapters';
import { R8SelectionEngine } from './selectionEngine';
import { R8TransformEngine } from './transformEngine';
import { R8TransformPreviewEngine } from './transformPreview';
import { R8TransformCommitEngine } from './transformCommit';
import { R8HistoryEngine } from './history';
import { R8UndoRedoEngine } from './undoRedo';
import { R8StaleStateEngine } from './staleState';
import { R8CausalityAuditor, R8CausalityEvent } from './causality';
import { R8InteractionValidator } from './validator';
import { R8SnapshotEngine } from './snapshot';
import {
  generateDeterministicSessionId,
  computeSessionChecksum,
  deterministicHash,
} from './determinism';

import { R7SceneGraph, R7LiveSyncStatus } from '../r7/types';
import { WorkspaceState } from '../r6/types';

export class R8InteractionEngine {
  private session: RealityInteractionSession;
  private realityChecksum: string;
  private workspaceChecksum: string;
  private causalityAuditor: R8CausalityAuditor;
  private operationSeq = 0;
  private selectionSeq = 0;
  private historySeq = 0;
  private commitSeq = 0;

  constructor(
    sceneGraph: R7SceneGraph,
    wsState: WorkspaceState,
    seq = 0
  ) {
    this.realityChecksum = R7InteractionReader.readRealityChecksum(wsState);
    this.workspaceChecksum = R7InteractionReader.readWorkspaceChecksum(wsState);
    this.causalityAuditor = new R8CausalityAuditor();

    const sessionId = generateDeterministicSessionId(wsState.workspaceId, seq);
    const targets = R7InteractionReader.extractTargets(sceneGraph);
    const selection = R8SelectionEngine.EMPTY_SELECTION;

    const sessionChecksum = computeSessionChecksum(
      sessionId, 'IDLE', Object.keys(targets).length, 0, 0, false
    );

    this.session = Object.freeze({
      sessionId,
      realityStateId: R7InteractionReader.readRealityStateId(wsState),
      workspaceId: wsState.workspaceId,
      sceneId: sceneGraph.sceneId,
      state: 'IDLE' as InteractionState,
      targets,
      selection,
      activePreview: null,
      history: Object.freeze([]),
      undoStack: Object.freeze([]),
      redoStack: Object.freeze([]),
      sessionChecksum,
    });

    this.causalityAuditor.logEvent('SESSION_CREATE', 'INTERACTION', this.realityChecksum, this.realityChecksum);
  }

  // ─── Session Accessors ───
  public getSession(): RealityInteractionSession { return this.session; }
  public getTargets(): Readonly<Record<string, InteractionTarget>> { return this.session.targets; }
  public getSelection(): InteractionSelection { return this.session.selection; }
  public getActivePreview(): TransformPreview | null { return this.session.activePreview; }
  public getHistory(): readonly InteractionHistoryEntry[] { return this.session.history; }
  public getUndoStack(): readonly InteractionHistoryEntry[] { return this.session.undoStack; }
  public getRedoStack(): readonly InteractionHistoryEntry[] { return this.session.redoStack; }
  public getCausalityEvents(): readonly R8CausalityEvent[] { return this.causalityAuditor.getEvents(); }
  public getRealityChecksum(): string { return this.realityChecksum; }
  public getWorkspaceChecksum(): string { return this.workspaceChecksum; }

  public getTarget(visualObjectId: string): InteractionTarget | undefined {
    return this.session.targets[visualObjectId];
  }

  // ─── Selection Operations ───
  public selectObject(visualObjectId: string): void {
    const selBefore = [...this.session.selection.selectedObjectIds];
    const selection = R8SelectionEngine.selectSingle(
      this.session.sessionId, visualObjectId, this.selectionSeq++
    );
    this.recordAndUpdate('SELECT', [visualObjectId], selBefore, [...selection.selectedObjectIds], { selection, state: 'SELECTING' as InteractionState });
  }

  public selectMultiple(visualObjectIds: readonly string[]): void {
    const selBefore = [...this.session.selection.selectedObjectIds];
    const selection = R8SelectionEngine.selectMultiple(
      this.session.sessionId, visualObjectIds, this.selectionSeq++
    );
    this.recordAndUpdate('SELECT', [...visualObjectIds], selBefore, [...selection.selectedObjectIds], { selection, state: 'SELECTING' as InteractionState });
  }

  public addToSelection(visualObjectId: string): void {
    const selBefore = [...this.session.selection.selectedObjectIds];
    const selection = R8SelectionEngine.addToSelection(
      this.session.selection, this.session.sessionId, visualObjectId, this.selectionSeq++
    );
    this.recordAndUpdate('SELECT', [visualObjectId], selBefore, [...selection.selectedObjectIds], { selection });
  }

  public removeFromSelection(visualObjectId: string): void {
    const selBefore = [...this.session.selection.selectedObjectIds];
    const selection = R8SelectionEngine.removeFromSelection(
      this.session.selection, this.session.sessionId, visualObjectId, this.selectionSeq++
    );
    this.recordAndUpdate('DESELECT', [visualObjectId], selBefore, [...selection.selectedObjectIds], { selection });
  }

  public deselectAll(): void {
    const selBefore = [...this.session.selection.selectedObjectIds];
    const selection = R8SelectionEngine.clearSelection(this.session.sessionId, this.selectionSeq++);
    this.recordAndUpdate('DESELECT', [], selBefore, [], { selection, state: 'IDLE' as InteractionState });
  }

  // ─── Transform Preview Operations ───
  public previewTranslate(visualObjectId: string, delta: readonly [number, number, number]): void {
    const target = this.session.targets[visualObjectId];
    if (!target) return;
    const preview = R8TransformPreviewEngine.createTranslatePreview(
      this.session.sessionId, target, delta
    );
    this.updateSession({ activePreview: preview, state: 'TRANSFORMING_PREVIEW' as InteractionState });
    this.causalityAuditor.logEvent('TRANSLATE_PREVIEW', 'PREVIEW', this.realityChecksum, this.realityChecksum);
  }

  public previewRotate(visualObjectId: string, delta: readonly [number, number, number]): void {
    const target = this.session.targets[visualObjectId];
    if (!target) return;
    const preview = R8TransformPreviewEngine.createRotatePreview(
      this.session.sessionId, target, delta
    );
    this.updateSession({ activePreview: preview, state: 'TRANSFORMING_PREVIEW' as InteractionState });
    this.causalityAuditor.logEvent('ROTATE_PREVIEW', 'PREVIEW', this.realityChecksum, this.realityChecksum);
  }

  public previewScale(visualObjectId: string, factor: readonly [number, number, number]): void {
    const target = this.session.targets[visualObjectId];
    if (!target) return;
    const preview = R8TransformPreviewEngine.createScalePreview(
      this.session.sessionId, target, factor
    );
    this.updateSession({ activePreview: preview, state: 'TRANSFORMING_PREVIEW' as InteractionState });
    this.causalityAuditor.logEvent('SCALE_PREVIEW', 'PREVIEW', this.realityChecksum, this.realityChecksum);
  }

  public cancelPreview(): void {
    if (!this.session.activePreview) return;
    const { restoredTransform, cancelledPreviewId } = R8TransformPreviewEngine.cancelPreview(this.session.activePreview);
    const targetId = this.session.activePreview.targetObjectId;
    const target = this.session.targets[targetId];
    if (target) {
      const restored = R8TransformEngine.applyTransformToTarget(target, restoredTransform);
      const newTargets = { ...this.session.targets, [targetId]: restored };
      this.updateSession({
        targets: Object.freeze(newTargets),
        activePreview: null,
        state: 'IDLE' as InteractionState,
      });
    } else {
      this.updateSession({ activePreview: null, state: 'IDLE' as InteractionState });
    }
    this.causalityAuditor.logEvent('CANCEL_PREVIEW', 'CANCEL', this.realityChecksum, this.realityChecksum);
  }

  // ─── Transform Commit ───
  public commitTransform(visualObjectId: string, newTransform: WorkspaceTransform, reason = 'USER_COMMIT'): TransformCommit | null {
    const target = this.session.targets[visualObjectId];
    if (!target) return null;

    const provenance: InteractionProvenance = Object.freeze({
      actorId: 'USER',
      reason,
      sourceDomain: 'WORKSPACE' as const,
      timestamp: 0,
    });

    const commit = R8TransformCommitEngine.commitTransform(target, newTransform, provenance, this.commitSeq++);
    const updatedTarget = R8TransformEngine.applyTransformToTarget(target, newTransform);
    const selBefore = [...this.session.selection.selectedObjectIds];

    const transformsBefore = this.extractTransforms();
    const newTargets = { ...this.session.targets, [visualObjectId]: updatedTarget };
    const transformsAfter = this.extractTransformsFrom(newTargets);

    const operation = R8HistoryEngine.createOperation(
      this.session.sessionId, 'COMMIT_TRANSFORM', [visualObjectId], commit.transformDelta, this.operationSeq++
    );
    const parentEntryId = this.session.history.length > 0
      ? this.session.history[this.session.history.length - 1].entryId
      : null;

    const entry = R8HistoryEngine.createEntry(
      this.session.sessionId, operation, parentEntryId,
      transformsBefore, transformsAfter,
      selBefore, selBefore, provenance, this.historySeq++
    );

    const newHistory = R8HistoryEngine.appendToHistory(this.session.history, entry);
    const newUndoStack = Object.freeze([...this.session.undoStack, entry]);
    const newRedoStack = R8UndoRedoEngine.clearRedoStack();

    this.updateSession({
      targets: Object.freeze(newTargets),
      activePreview: null,
      state: 'COMMITTED' as InteractionState,
      history: newHistory,
      undoStack: newUndoStack,
      redoStack: newRedoStack,
    });

    this.causalityAuditor.logEvent('COMMIT_TRANSFORM', 'COMMIT', this.realityChecksum, this.realityChecksum);
    return commit;
  }

  // ─── Commit from Active Preview ───
  public commitActivePreview(reason = 'USER_COMMIT_PREVIEW'): TransformCommit | null {
    if (!this.session.activePreview || !this.session.activePreview.isActive) return null;
    const preview = this.session.activePreview;
    return this.commitTransform(preview.targetObjectId, preview.previewTransform, reason);
  }

  // ─── Undo/Redo ───
  public undo(): boolean {
    const result = R8UndoRedoEngine.undo(this.session.undoStack, this.session.redoStack);
    if (!result.applied) return false;

    const newTargets = this.applyRestoredTransforms(result.restoredTransforms);
    const selBefore = [...this.session.selection.selectedObjectIds];
    const selAfter = [...result.restoredSelection];

    const undoOp = R8HistoryEngine.createOperation(
      this.session.sessionId, 'UNDO', [...result.restoredSelection], undefined, this.operationSeq++
    );
    const parentEntryId = this.session.history.length > 0
      ? this.session.history[this.session.history.length - 1].entryId
      : null;
    const transformsBefore = this.extractTransforms();
    const transformsAfter = this.extractTransformsFrom(newTargets);

    const prov: InteractionProvenance = Object.freeze({
      actorId: 'USER', reason: 'UNDO', sourceDomain: 'WORKSPACE' as const, timestamp: 0,
    });
    const entry = R8HistoryEngine.createEntry(
      this.session.sessionId, undoOp, parentEntryId,
      transformsBefore, transformsAfter, selBefore, selAfter, prov, this.historySeq++
    );
    const newHistory = R8HistoryEngine.appendToHistory(this.session.history, entry);

    const selection = result.restoredSelection.length > 0
      ? R8SelectionEngine.selectMultiple(this.session.sessionId, result.restoredSelection, this.selectionSeq++)
      : R8SelectionEngine.clearSelection(this.session.sessionId, this.selectionSeq++);

    this.updateSession({
      targets: Object.freeze(newTargets),
      selection,
      undoStack: result.undoStack,
      redoStack: result.redoStack,
      history: newHistory,
      state: 'IDLE' as InteractionState,
    });

    this.causalityAuditor.logEvent('UNDO', 'UNDO', this.realityChecksum, this.realityChecksum);
    return true;
  }

  public redo(): boolean {
    const result = R8UndoRedoEngine.redo(this.session.undoStack, this.session.redoStack);
    if (!result.applied) return false;

    const newTargets = this.applyRestoredTransforms(result.restoredTransforms);
    const selBefore = [...this.session.selection.selectedObjectIds];
    const selAfter = [...result.restoredSelection];

    const redoOp = R8HistoryEngine.createOperation(
      this.session.sessionId, 'REDO', [...result.restoredSelection], undefined, this.operationSeq++
    );
    const parentEntryId = this.session.history.length > 0
      ? this.session.history[this.session.history.length - 1].entryId
      : null;
    const transformsBefore = this.extractTransforms();
    const transformsAfter = this.extractTransformsFrom(newTargets);

    const prov: InteractionProvenance = Object.freeze({
      actorId: 'USER', reason: 'REDO', sourceDomain: 'WORKSPACE' as const, timestamp: 0,
    });
    const entry = R8HistoryEngine.createEntry(
      this.session.sessionId, redoOp, parentEntryId,
      transformsBefore, transformsAfter, selBefore, selAfter, prov, this.historySeq++
    );
    const newHistory = R8HistoryEngine.appendToHistory(this.session.history, entry);

    const selection = result.restoredSelection.length > 0
      ? R8SelectionEngine.selectMultiple(this.session.sessionId, result.restoredSelection, this.selectionSeq++)
      : R8SelectionEngine.clearSelection(this.session.sessionId, this.selectionSeq++);

    this.updateSession({
      targets: Object.freeze(newTargets),
      selection,
      undoStack: result.undoStack,
      redoStack: result.redoStack,
      history: newHistory,
      state: 'IDLE' as InteractionState,
    });

    this.causalityAuditor.logEvent('REDO', 'REDO', this.realityChecksum, this.realityChecksum);
    return true;
  }

  public canUndo(): boolean { return R8UndoRedoEngine.canUndo(this.session.undoStack); }
  public canRedo(): boolean { return R8UndoRedoEngine.canRedo(this.session.redoStack); }

  // ─── Reset ───
  public resetAllTransforms(): void {
    const selBefore = [...this.session.selection.selectedObjectIds];
    const transformsBefore = this.extractTransforms();

    const newTargets: Record<string, InteractionTarget> = {};
    for (const [id, target] of Object.entries(this.session.targets)) {
      newTargets[id] = R8TransformEngine.applyTransformToTarget(target, R8TransformEngine.IDENTITY_TRANSFORM);
    }
    const transformsAfter = this.extractTransformsFrom(newTargets);

    const op = R8HistoryEngine.createOperation(
      this.session.sessionId, 'RESET_TRANSFORM', Object.keys(newTargets), undefined, this.operationSeq++
    );
    const parentEntryId = this.session.history.length > 0
      ? this.session.history[this.session.history.length - 1].entryId
      : null;
    const prov: InteractionProvenance = Object.freeze({
      actorId: 'USER', reason: 'RESET', sourceDomain: 'WORKSPACE' as const, timestamp: 0,
    });
    const entry = R8HistoryEngine.createEntry(
      this.session.sessionId, op, parentEntryId,
      transformsBefore, transformsAfter, selBefore, selBefore, prov, this.historySeq++
    );
    const newHistory = R8HistoryEngine.appendToHistory(this.session.history, entry);
    const newUndoStack = Object.freeze([...this.session.undoStack, entry]);
    const newRedoStack = R8UndoRedoEngine.clearRedoStack();

    this.updateSession({
      targets: Object.freeze(newTargets),
      activePreview: null,
      state: 'IDLE' as InteractionState,
      history: newHistory,
      undoStack: newUndoStack,
      redoStack: newRedoStack,
    });

    this.causalityAuditor.logEvent('RESET_TRANSFORM', 'RESET', this.realityChecksum, this.realityChecksum);
  }

  // ─── Stale / Resync ───
  public getSyncStatus(currentRealityChecksum?: string): InteractionStaleState {
    const check = currentRealityChecksum ?? this.realityChecksum;
    return R8StaleStateEngine.evaluateSync(check, this.realityChecksum);
  }

  public resyncFromSceneGraph(
    sceneGraph: R7SceneGraph,
    wsState: WorkspaceState
  ): void {
    const newRealityChecksum = R7InteractionReader.readRealityChecksum(wsState);
    const newWorkspaceChecksum = R7InteractionReader.readWorkspaceChecksum(wsState);

    // Preserve existing transforms for targets that still exist
    const existingTransforms: Record<string, WorkspaceTransform> = {};
    for (const [id, target] of Object.entries(this.session.targets)) {
      existingTransforms[id] = target.workspaceTransform;
    }

    const newTargets = R7InteractionReader.extractTargets(sceneGraph, existingTransforms);

    this.realityChecksum = newRealityChecksum;
    this.workspaceChecksum = newWorkspaceChecksum;

    this.updateSession({
      targets: newTargets,
      realityStateId: R7InteractionReader.readRealityStateId(wsState),
    });

    this.causalityAuditor.logEvent('RESYNC', 'INTERACTION', newRealityChecksum, newRealityChecksum);
  }

  // ─── Snapshot ───
  public createSnapshot(seq = 0): InteractionSnapshot {
    return R8SnapshotEngine.createSnapshot(this.session, this.realityChecksum, this.workspaceChecksum, seq);
  }

  // ─── Validation ───
  public validate(): InteractionValidationReport {
    return R8InteractionValidator.validateSession(this.session);
  }

  // ─── Execution Signature (σ²=0) ───
  public computeExecutionSignature(): InteractionExecutionSignature {
    const executionHash = deterministicHash(
      JSON.stringify([
        this.realityChecksum,
        this.workspaceChecksum,
        this.session.sessionChecksum,
        this.session.selection.selectionChecksum,
        this.session.history.length,
        this.getSyncStatus(),
      ])
    );

    return Object.freeze({
      realityChecksum: this.realityChecksum,
      workspaceChecksum: this.workspaceChecksum,
      interactionChecksum: this.session.sessionChecksum,
      selectedCount: this.session.selection.selectedObjectIds.length,
      historyCount: this.session.history.length,
      syncStatus: this.getSyncStatus(),
      executionHash,
    });
  }

  // ─── Binding State ───
  public getBindingState(): InteractionBindingState {
    return Object.freeze({
      isBound: true,
      realityStateChecksum: this.realityChecksum,
      lastSyncedRealityChecksum: this.realityChecksum,
      staleState: this.getSyncStatus(),
    });
  }

  // ─── Internal Helpers ───
  private updateSession(partial: Partial<RealityInteractionSession>): void {
    const merged = { ...this.session, ...partial };
    const sessionChecksum = computeSessionChecksum(
      merged.sessionId,
      merged.state,
      Object.keys(merged.targets).length,
      merged.selection.selectedObjectIds.length,
      merged.history.length,
      merged.activePreview !== null
    );
    this.session = Object.freeze({ ...merged, sessionChecksum });
  }

  private recordAndUpdate(
    opType: InteractionOperationType,
    targetObjectIds: string[],
    selBefore: string[],
    selAfter: string[],
    updates: Partial<RealityInteractionSession>
  ): void {
    const transformsBefore = this.extractTransforms();
    const op = R8HistoryEngine.createOperation(
      this.session.sessionId, opType, targetObjectIds, undefined, this.operationSeq++
    );
    const parentEntryId = this.session.history.length > 0
      ? this.session.history[this.session.history.length - 1].entryId
      : null;
    const prov: InteractionProvenance = Object.freeze({
      actorId: 'USER', reason: opType, sourceDomain: 'INTERACTION' as const, timestamp: 0,
    });
    const entry = R8HistoryEngine.createEntry(
      this.session.sessionId, op, parentEntryId,
      transformsBefore, transformsBefore, selBefore, selAfter, prov, this.historySeq++
    );
    const newHistory = R8HistoryEngine.appendToHistory(this.session.history, entry);

    this.updateSession({ ...updates, history: newHistory });
    this.causalityAuditor.logEvent(opType, opType === 'SELECT' || opType === 'DESELECT' ? 'SELECTION' : 'INTERACTION', this.realityChecksum, this.realityChecksum);
  }

  private extractTransforms(): Readonly<Record<string, WorkspaceTransform>> {
    return this.extractTransformsFrom(this.session.targets);
  }

  private extractTransformsFrom(targets: Readonly<Record<string, InteractionTarget>> | Record<string, InteractionTarget>): Readonly<Record<string, WorkspaceTransform>> {
    const result: Record<string, WorkspaceTransform> = {};
    for (const [id, t] of Object.entries(targets)) {
      result[id] = t.workspaceTransform;
    }
    return Object.freeze(result);
  }

  private applyRestoredTransforms(restored: Readonly<Record<string, WorkspaceTransform>>): Record<string, InteractionTarget> {
    const newTargets: Record<string, InteractionTarget> = {};
    for (const [id, target] of Object.entries(this.session.targets)) {
      const xform = restored[id] ?? target.workspaceTransform;
      newTargets[id] = R8TransformEngine.applyTransformToTarget(target, xform);
    }
    return newTargets;
  }
}

type InteractionOperationType =
  | 'SELECT' | 'DESELECT' | 'TRANSLATE_PREVIEW' | 'ROTATE_PREVIEW' | 'SCALE_PREVIEW'
  | 'COMMIT_TRANSFORM' | 'CANCEL_PREVIEW' | 'RESET_TRANSFORM' | 'UNDO' | 'REDO';
