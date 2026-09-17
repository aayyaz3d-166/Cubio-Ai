/**
 * 3D Memory Studio — Funnel 61
 * Bounded Camera History
 *
 * Stores up to 20 serializable camera state snapshots for undo/redo.
 */

import { CameraState } from '../types';
import { cloneCameraState } from '../camera/cameraState';

export const MAX_CAMERA_HISTORY = 20;

export class CameraHistory {
  private undoStack: CameraState[] = [];
  private redoStack: CameraState[] = [];

  public save(state: CameraState): void {
    this.undoStack.push(cloneCameraState(state));
    if (this.undoStack.length > MAX_CAMERA_HISTORY) {
      this.undoStack.shift(); // Evict oldest
    }
    this.redoStack = []; // Clear redo on new action
  }

  public undo(currentState: CameraState): CameraState | null {
    if (this.undoStack.length === 0) return null;

    const previous = this.undoStack.pop()!;
    this.redoStack.push(cloneCameraState(currentState));
    return previous;
  }

  public redo(currentState: CameraState): CameraState | null {
    if (this.redoStack.length === 0) return null;

    const next = this.redoStack.pop()!;
    this.undoStack.push(cloneCameraState(currentState));
    return next;
  }

  public clear(): void {
    this.undoStack = [];
    this.redoStack = [];
  }

  public get count(): number {
    return this.undoStack.length;
  }
}
