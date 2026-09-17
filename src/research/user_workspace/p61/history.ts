/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.1: Workspace History Engine
 *
 * Provides deterministic Undo and Redo operations over immutable workspace states.
 */

import {
  WorkspaceReality,
  WorkspaceObserver,
  WorkspaceSelection,
  WorkspaceOperationType,
  WorkspaceHistoryEntry,
} from './types';

export class WorkspaceHistoryManager {
  private undoStack: WorkspaceHistoryEntry[] = [];
  private redoStack: WorkspaceHistoryEntry[] = [];
  private currentStep = 0;

  constructor() {
    this.undoStack = [];
    this.redoStack = [];
    this.currentStep = 0;
  }

  public record(
    operation: WorkspaceOperationType,
    description: string,
    reality: WorkspaceReality,
    observer: WorkspaceObserver,
    selection: WorkspaceSelection
  ): WorkspaceHistoryEntry {
    this.currentStep++;
    const entry: WorkspaceHistoryEntry = Object.freeze({
      step: this.currentStep,
      operation,
      description,
      realitySnapshot: reality,
      observerSnapshot: observer,
      selectionSnapshot: selection,
      timestamp: Date.now(),
    });

    this.undoStack.push(entry);
    this.redoStack = []; // Clear redo stack upon new recorded operation
    return entry;
  }

  public canUndo(): boolean {
    return this.undoStack.length > 1; // Keep at least the baseline initial entry
  }

  public canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  public undo(): WorkspaceHistoryEntry | null {
    if (!this.canUndo()) return null;

    const current = this.undoStack.pop()!;
    this.redoStack.push(current);

    // The target restored state is now the top of undoStack
    return this.undoStack[this.undoStack.length - 1];
  }

  public redo(): WorkspaceHistoryEntry | null {
    if (!this.canRedo()) return null;

    const next = this.redoStack.pop()!;
    this.undoStack.push(next);
    return next;
  }

  public clear(): void {
    this.undoStack = [];
    this.redoStack = [];
    this.currentStep = 0;
  }

  public getHistoryLength(): number {
    return this.undoStack.length;
  }
}
