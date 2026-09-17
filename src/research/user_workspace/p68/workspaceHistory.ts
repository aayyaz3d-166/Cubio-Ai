/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.8: Workspace History Manager
 *
 * Isolated Undo/Redo stack for personal space management.
 */

import { PersonalSpace } from './types';

export interface SpaceHistoryEntry {
  readonly space: PersonalSpace;
  readonly actionDescription: string;
}

export class WorkspaceHistoryManager {
  private undoStack: SpaceHistoryEntry[] = [];
  private redoStack: SpaceHistoryEntry[] = [];

  constructor(initialSpace: PersonalSpace) {
    this.undoStack = [
      Object.freeze({
        space: initialSpace,
        actionDescription: 'Initial Space State',
      }),
    ];
    this.redoStack = [];
  }

  public recordSpace(space: PersonalSpace, actionDescription: string): void {
    this.undoStack.push(Object.freeze({ space, actionDescription }));
    this.redoStack = [];
  }

  public canUndo(): boolean {
    return this.undoStack.length > 1;
  }

  public canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  public undo(): SpaceHistoryEntry | null {
    if (!this.canUndo()) return null;
    const current = this.undoStack.pop()!;
    this.redoStack.push(current);
    return this.undoStack[this.undoStack.length - 1];
  }

  public redo(): SpaceHistoryEntry | null {
    if (!this.canRedo()) return null;
    const next = this.redoStack.pop()!;
    this.undoStack.push(next);
    return next;
  }
}
