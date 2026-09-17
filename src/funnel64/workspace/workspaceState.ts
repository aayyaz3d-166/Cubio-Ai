/**
 * 3D Memory Studio — Funnel 64
 * Workspace State Machine & Transition Validation
 */

import { WorkspaceStateMode } from '../types';

export class WorkspaceStateMachine {
  private currentMode: WorkspaceStateMode = 'INITIALIZING';

  private readonly validTransitions: Record<WorkspaceStateMode, readonly WorkspaceStateMode[]> = {
    INITIALIZING: ['READY', 'DISPOSING'],
    READY: ['PANEL_OPENING', 'PANEL_ACTIVE', 'PANEL_CLOSING', 'LAYOUT_TRANSITION', 'DISPOSING'],
    PANEL_OPENING: ['PANEL_ACTIVE', 'READY', 'DISPOSING'],
    PANEL_ACTIVE: ['PANEL_CLOSING', 'PANEL_OPENING', 'READY', 'LAYOUT_TRANSITION', 'DISPOSING'],
    PANEL_CLOSING: ['READY', 'PANEL_ACTIVE', 'DISPOSING'],
    LAYOUT_TRANSITION: ['READY', 'PANEL_ACTIVE', 'DISPOSING'],
    DISPOSING: ['DISPOSED'],
    DISPOSED: [],
  };

  public canTransitionTo(target: WorkspaceStateMode): boolean {
    return this.validTransitions[this.currentMode].includes(target);
  }

  public transitionTo(target: WorkspaceStateMode): boolean {
    if (!this.canTransitionTo(target)) {
      return false;
    }
    this.currentMode = target;
    return true;
  }

  public get mode(): WorkspaceStateMode {
    return this.currentMode;
  }

  public reset(): void {
    this.currentMode = 'READY';
  }
}
