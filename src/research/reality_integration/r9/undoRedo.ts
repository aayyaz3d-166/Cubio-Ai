/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R9: Undo / Redo Engine
 *
 * Implements deterministic undo/redo for geometry states.
 * Invariant: Operates ONLY within Workspace Geometry domain. Never mutates Reality.
 * ΔReality = 0.
 */

import {
  GeometrySession,
  GeometryHistoryEntry,
  WorkspaceGeometry,
  GeometryProvenance,
} from './types';

export class R9UndoRedoEngine {
  /**
   * Performs deterministic undo on geometry session.
   */
  public static undo(
    session: GeometrySession,
    geometrySnapshots: Readonly<Record<string, Readonly<Record<string, WorkspaceGeometry>>>>
  ): GeometrySession {
    if (session.history.length === 0) {
      return session;
    }

    const lastEntry = session.history[session.history.length - 1];
    const newHistory = session.history.slice(0, -1);
    const newUndoStack = session.undoStack; // can track if needed
    const newRedoStack = Object.freeze([...session.redoStack, lastEntry]);

    // Restore state from previous entry or initial
    const targetStateIds = lastEntry.geometryStateBefore;
    const restoredGeometries: Record<string, WorkspaceGeometry> = {};

    for (const geoId of targetStateIds) {
      const snap = geometrySnapshots[lastEntry.entryId] ?? session.geometries;
      if (snap[geoId]) {
        restoredGeometries[geoId] = snap[geoId];
      } else if (session.geometries[geoId]) {
        restoredGeometries[geoId] = session.geometries[geoId];
      }
    }

    return Object.freeze({
      ...session,
      geometries: Object.freeze(restoredGeometries),
      history: Object.freeze(newHistory),
      undoStack: Object.freeze(newUndoStack),
      redoStack: Object.freeze(newRedoStack),
    });
  }

  /**
   * Performs deterministic redo on geometry session.
   */
  public static redo(
    session: GeometrySession,
    geometrySnapshots: Readonly<Record<string, Readonly<Record<string, WorkspaceGeometry>>>>
  ): GeometrySession {
    if (session.redoStack.length === 0) {
      return session;
    }

    const entryToRedo = session.redoStack[session.redoStack.length - 1];
    const newRedoStack = session.redoStack.slice(0, -1);
    const newHistory = Object.freeze([...session.history, entryToRedo]);

    const targetStateIds = entryToRedo.geometryStateAfter;
    const restoredGeometries: Record<string, WorkspaceGeometry> = {};

    for (const geoId of targetStateIds) {
      const snap = geometrySnapshots[entryToRedo.entryId] ?? session.geometries;
      if (snap[geoId]) {
        restoredGeometries[geoId] = snap[geoId];
      } else if (session.geometries[geoId]) {
        restoredGeometries[geoId] = session.geometries[geoId];
      }
    }

    return Object.freeze({
      ...session,
      geometries: Object.freeze(restoredGeometries),
      history: newHistory,
      redoStack: Object.freeze(newRedoStack),
    });
  }
}
