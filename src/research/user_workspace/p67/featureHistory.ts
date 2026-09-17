/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.7: Parametric Feature History Manager
 *
 * Dedicated Undo/Redo stack for parametric feature operations without viewport pollution.
 */

import { ParametricFeatureGraph } from './types';

export interface FeatureHistoryItem {
  readonly graph: ParametricFeatureGraph;
  readonly description: string;
}

export class FeatureHistoryManager {
  private undoStack: FeatureHistoryItem[] = [];
  private redoStack: FeatureHistoryItem[] = [];

  constructor(initialGraph: ParametricFeatureGraph) {
    this.undoStack = [
      Object.freeze({
        graph: initialGraph,
        description: 'Baseline Feature Graph',
      }),
    ];
    this.redoStack = [];
  }

  public recordGraph(graph: ParametricFeatureGraph, description: string): void {
    this.undoStack.push(Object.freeze({ graph, description }));
    this.redoStack = [];
  }

  public canUndo(): boolean {
    return this.undoStack.length > 1;
  }

  public canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  public undo(): FeatureHistoryItem | null {
    if (!this.canUndo()) return null;
    const current = this.undoStack.pop()!;
    this.redoStack.push(current);
    return this.undoStack[this.undoStack.length - 1];
  }

  public redo(): FeatureHistoryItem | null {
    if (!this.canRedo()) return null;
    const next = this.redoStack.pop()!;
    this.undoStack.push(next);
    return next;
  }
}
