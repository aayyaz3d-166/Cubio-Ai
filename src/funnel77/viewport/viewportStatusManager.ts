/**
 * 3D Memory Studio — Funnel 77
 * Viewport Status Manager
 */

import { ViewportState, ViewportSnapshot, SpatialSelectionContext, ViewportControlsState } from '../types';
import { ViewportStateMachine } from './viewportState';

export type ViewportStatusListener = (snapshot: ViewportSnapshot) => void;

export class ViewportStatusManager {
  public readonly stateMachine = new ViewportStateMachine();
  private isCanvasAttached = false;
  private isSceneAttached = false;
  private objectCount = 0;
  private selectedObject: SpatialSelectionContext | null = null;
  private controls: ViewportControlsState = {
    showAxes: true,
    showGrid: true,
    activePreset: null,
    activeDimension: 3,
  };
  private lastError?: string;
  private readonly listeners: Set<ViewportStatusListener> = new Set();

  public getSnapshot(): ViewportSnapshot {
    return {
      state: this.stateMachine.getState(),
      isCanvasAttached: this.isCanvasAttached,
      isSceneAttached: this.isSceneAttached,
      objectCount: this.objectCount,
      selectedObject: this.selectedObject,
      controls: { ...this.controls },
      error: this.lastError,
      timestamp: Date.now(),
    };
  }

  public updateStatus(partial: {
    state?: ViewportState;
    isCanvasAttached?: boolean;
    isSceneAttached?: boolean;
    objectCount?: number;
    selectedObject?: SpatialSelectionContext | null;
    controls?: Partial<ViewportControlsState>;
    error?: string;
  }): void {
    if (partial.state) {
      this.stateMachine.transitionTo(partial.state);
    }
    if (partial.isCanvasAttached !== undefined) {
      this.isCanvasAttached = partial.isCanvasAttached;
    }
    if (partial.isSceneAttached !== undefined) {
      this.isSceneAttached = partial.isSceneAttached;
    }
    if (partial.objectCount !== undefined) {
      this.objectCount = partial.objectCount;
    }
    if (partial.selectedObject !== undefined) {
      this.selectedObject = partial.selectedObject;
    }
    if (partial.controls) {
      this.controls = { ...this.controls, ...partial.controls };
    }
    if (partial.error !== undefined) {
      this.lastError = partial.error;
    }

    this.notify();
  }

  public subscribe(listener: ViewportStatusListener): () => void {
    this.listeners.add(listener);
    listener(this.getSnapshot());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    const snap = this.getSnapshot();
    for (const listener of this.listeners) {
      listener(snap);
    }
  }

  public reset(): void {
    this.stateMachine.reset();
    this.isCanvasAttached = false;
    this.isSceneAttached = false;
    this.objectCount = 0;
    this.selectedObject = null;
    this.lastError = undefined;
    this.notify();
  }
}
