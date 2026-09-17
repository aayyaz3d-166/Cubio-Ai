/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.4: Fusion History Manager
 *
 * Dedicated Reality Undo/Redo history stack avoiding cross-contamination
 * from observer viewpoint changes or fusion subset selections.
 */

import { WorkspaceReality, WorkspaceSelection } from '../p61/types';

export interface FusionRealityHistoryItem {
  readonly reality: WorkspaceReality;
  readonly selection: WorkspaceSelection;
  readonly description: string;
}

export class FusionHistoryManager {
  private undoStack: FusionRealityHistoryItem[] = [];
  private redoStack: FusionRealityHistoryItem[] = [];

  constructor(initialReality: WorkspaceReality, initialSelection: WorkspaceSelection) {
    this.undoStack = [
      Object.freeze({
        reality: initialReality,
        selection: initialSelection,
        description: 'Initial Baseline',
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
    this.redoStack = [];
  }

  public canUndo(): boolean {
    return this.undoStack.length > 1;
  }

  public canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  public undo(): FusionRealityHistoryItem | null {
    if (!this.canUndo()) return null;
    const current = this.undoStack.pop()!;
    this.redoStack.push(current);
    return this.undoStack[this.undoStack.length - 1];
  }

  public redo(): FusionRealityHistoryItem | null {
    if (!this.canRedo()) return null;
    const next = this.redoStack.pop()!;
    this.undoStack.push(next);
    return next;
  }
}
