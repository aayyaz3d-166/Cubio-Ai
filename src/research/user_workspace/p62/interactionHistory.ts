/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.2: Interaction History Engine
 *
 * Distinctly manages Reality Undo/Redo stacks without pollution from camera movements.
 */

import { WorkspaceReality, WorkspaceSelection } from '../p61/types';

export interface RealityHistoryState {
  readonly reality: WorkspaceReality;
  readonly selection: WorkspaceSelection;
  readonly description: string;
}

export class InteractionHistoryManager {
  private undoStack: RealityHistoryState[] = [];
  private redoStack: RealityHistoryState[] = [];

  constructor(initialReality: WorkspaceReality, initialSelection: WorkspaceSelection) {
    this.undoStack = [
      Object.freeze({
        reality: initialReality,
        selection: initialSelection,
        description: 'Initial Reality Baseline',
      }),
    ];
    this.redoStack = [];
  }

  public recordMutation(
    reality: WorkspaceReality,
    selection: WorkspaceSelection,
    description: string
  ): void {
    this.undoStack.push(
      Object.freeze({
        reality,
        selection,
        description,
      })
    );
    this.redoStack = []; // Clear redo on new action
  }

  public canUndo(): boolean {
    return this.undoStack.length > 1;
  }

  public canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  public undo(): RealityHistoryState | null {
    if (!this.canUndo()) return null;
    const current = this.undoStack.pop()!;
    this.redoStack.push(current);
    return this.undoStack[this.undoStack.length - 1];
  }

  public redo(): RealityHistoryState | null {
    if (!this.canRedo()) return null;
    const next = this.redoStack.pop()!;
    this.undoStack.push(next);
    return next;
  }

  public clear(initialReality: WorkspaceReality, initialSelection: WorkspaceSelection): void {
    this.undoStack = [
      Object.freeze({
        reality: initialReality,
        selection: initialSelection,
        description: 'Cleared Reality Baseline',
      }),
    ];
    this.redoStack = [];
  }

  public getUndoCount(): number {
    return this.undoStack.length;
  }
}
