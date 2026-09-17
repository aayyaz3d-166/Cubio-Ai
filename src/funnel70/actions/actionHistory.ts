/**
 * 3D Memory Studio — Funnel 70
 * Studio Action History
 *
 * Maintains a bounded execution history ring buffer capped at 20 entries.
 */

import { StudioAction, StudioActionResult, ActionHistoryEntry } from '../types';
import { MAX_ACTION_HISTORY } from './actionTypes';

export class StudioActionHistory {
  private history: ActionHistoryEntry[] = [];

  public record(action: StudioAction, result: StudioActionResult): void {
    this.history.push({ action, result });
    if (this.history.length > MAX_ACTION_HISTORY) {
      this.history = this.history.slice(-MAX_ACTION_HISTORY);
    }
  }

  public getHistory(): readonly ActionHistoryEntry[] {
    return [...this.history];
  }

  public getLastResult(): StudioActionResult | null {
    if (this.history.length === 0) return null;
    return this.history[this.history.length - 1].result;
  }

  public clearHistory(): void {
    this.history = [];
  }

  public get size(): number {
    return this.history.length;
  }
}
