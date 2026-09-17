/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R8: Undo/Redo Engine
 *
 * Deterministic undo/redo operating ONLY on Workspace interaction state.
 * Never rewrites Reality history. ΔReality = 0.
 */

import {
  InteractionHistoryEntry,
  WorkspaceTransform,
} from './types';

export interface UndoRedoResult {
  readonly undoStack: readonly InteractionHistoryEntry[];
  readonly redoStack: readonly InteractionHistoryEntry[];
  readonly restoredTransforms: Readonly<Record<string, WorkspaceTransform>>;
  readonly restoredSelection: readonly string[];
  readonly applied: boolean;
}

export class R8UndoRedoEngine {
  public static undo(
    undoStack: readonly InteractionHistoryEntry[],
    redoStack: readonly InteractionHistoryEntry[]
  ): UndoRedoResult {
    if (undoStack.length === 0) {
      return {
        undoStack,
        redoStack,
        restoredTransforms: Object.freeze({}),
        restoredSelection: Object.freeze([]),
        applied: false,
      };
    }

    const entry = undoStack[undoStack.length - 1];
    const newUndoStack = Object.freeze(undoStack.slice(0, -1));
    const newRedoStack = Object.freeze([...redoStack, entry]);

    return {
      undoStack: newUndoStack,
      redoStack: newRedoStack,
      restoredTransforms: entry.stateBefore,
      restoredSelection: entry.selectionBefore,
      applied: true,
    };
  }

  public static redo(
    undoStack: readonly InteractionHistoryEntry[],
    redoStack: readonly InteractionHistoryEntry[]
  ): UndoRedoResult {
    if (redoStack.length === 0) {
      return {
        undoStack,
        redoStack,
        restoredTransforms: Object.freeze({}),
        restoredSelection: Object.freeze([]),
        applied: false,
      };
    }

    const entry = redoStack[redoStack.length - 1];
    const newRedoStack = Object.freeze(redoStack.slice(0, -1));
    const newUndoStack = Object.freeze([...undoStack, entry]);

    return {
      undoStack: newUndoStack,
      redoStack: newRedoStack,
      restoredTransforms: entry.stateAfter,
      restoredSelection: entry.selectionAfter,
      applied: true,
    };
  }

  public static canUndo(undoStack: readonly InteractionHistoryEntry[]): boolean {
    return undoStack.length > 0;
  }

  public static canRedo(redoStack: readonly InteractionHistoryEntry[]): boolean {
    return redoStack.length > 0;
  }

  public static clearRedoStack(): readonly InteractionHistoryEntry[] {
    return Object.freeze([]);
  }
}
