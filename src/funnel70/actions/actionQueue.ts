/**
 * 3D Memory Studio — Funnel 70
 * Studio Action Queue
 *
 * Enforces a strict FIFO queue with a hard limit of 5 pending actions.
 * Detects and prevents duplicate pending actions.
 */

import { StudioAction } from '../types';
import { MAX_PENDING_ACTIONS } from './actionTypes';

export class StudioActionQueue {
  private queue: StudioAction[] = [];
  private currentAction: StudioAction | null = null;

  public enqueue(action: StudioAction): { accepted: boolean; reason?: string } {
    if (this.queue.length >= MAX_PENDING_ACTIONS) {
      return {
        accepted: false,
        reason: `Queue limit reached: maximum ${MAX_PENDING_ACTIONS} pending actions allowed.`,
      };
    }

    // Check duplicate
    const isDuplicate = this.queue.some(
      (a) => a.type === action.type && a.target === action.target && JSON.stringify(a.parameters) === JSON.stringify(action.parameters)
    );

    if (isDuplicate) {
      return {
        accepted: false,
        reason: `Duplicate action detected in queue for type "${action.type}" and target "${action.target}".`,
      };
    }

    this.queue.push(action);
    return { accepted: true };
  }

  public dequeue(): StudioAction | undefined {
    return this.queue.shift();
  }

  public cancel(actionId: string): boolean {
    const idx = this.queue.findIndex((a) => a.id === actionId);
    if (idx !== -1) {
      this.queue[idx].status = 'CANCELLED';
      this.queue.splice(idx, 1);
      return true;
    }
    if (this.currentAction && this.currentAction.id === actionId) {
      this.currentAction.status = 'CANCELLED';
      this.currentAction = null;
      return true;
    }
    return false;
  }

  public clear(): void {
    this.queue = [];
    this.currentAction = null;
  }

  public getPending(): readonly StudioAction[] {
    return [...this.queue];
  }

  public getCurrent(): StudioAction | null {
    return this.currentAction;
  }

  public setCurrent(action: StudioAction | null): void {
    this.currentAction = action;
  }

  public get size(): number {
    return this.queue.length;
  }
}
