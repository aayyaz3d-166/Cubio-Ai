/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.5: Model History Manager
 *
 * Distinct Undo/Redo stack for 3D model scene states unpolluted by camera movements.
 */

import { ModelScene3D } from './types';

export interface ModelHistoryItem {
  readonly scene: ModelScene3D;
  readonly description: string;
}

export class ModelHistoryManager {
  private undoStack: ModelHistoryItem[] = [];
  private redoStack: ModelHistoryItem[] = [];

  constructor(initialScene: ModelScene3D) {
    this.undoStack = [
      Object.freeze({
        scene: initialScene,
        description: 'Baseline Model Scene',
      }),
    ];
    this.redoStack = [];
  }

  public recordScene(scene: ModelScene3D, description: string): void {
    this.undoStack.push(Object.freeze({ scene, description }));
    this.redoStack = [];
  }

  public canUndo(): boolean {
    return this.undoStack.length > 1;
  }

  public canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  public undo(): ModelHistoryItem | null {
    if (!this.canUndo()) return null;
    const current = this.undoStack.pop()!;
    this.redoStack.push(current);
    return this.undoStack[this.undoStack.length - 1];
  }

  public redo(): ModelHistoryItem | null {
    if (!this.canRedo()) return null;
    const next = this.redoStack.pop()!;
    this.undoStack.push(next);
    return next;
  }
}
