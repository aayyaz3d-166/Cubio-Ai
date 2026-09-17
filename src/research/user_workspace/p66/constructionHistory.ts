/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.6: Construction History Manager
 *
 * Dedicated Undo/Redo stack for advanced geometry construction operations.
 */

import { AdvancedGeometryScene } from './types';

export interface ConstructionHistoryItem {
  readonly scene: AdvancedGeometryScene;
  readonly description: string;
}

export class ConstructionHistoryManager {
  private undoStack: ConstructionHistoryItem[] = [];
  private redoStack: ConstructionHistoryItem[] = [];

  constructor(initialScene: AdvancedGeometryScene) {
    this.undoStack = [
      Object.freeze({
        scene: initialScene,
        description: 'Baseline Geometry Scene',
      }),
    ];
    this.redoStack = [];
  }

  public recordScene(scene: AdvancedGeometryScene, description: string): void {
    this.undoStack.push(Object.freeze({ scene, description }));
    this.redoStack = [];
  }

  public canUndo(): boolean {
    return this.undoStack.length > 1;
  }

  public canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  public undo(): ConstructionHistoryItem | null {
    if (!this.canUndo()) return null;
    const current = this.undoStack.pop()!;
    this.redoStack.push(current);
    return this.undoStack[this.undoStack.length - 1];
  }

  public redo(): ConstructionHistoryItem | null {
    if (!this.canRedo()) return null;
    const next = this.redoStack.pop()!;
    this.undoStack.push(next);
    return next;
  }
}
