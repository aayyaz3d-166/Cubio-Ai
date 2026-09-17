/**
 * 3D Memory Studio — Funnel 66
 * Bounded Navigation History Stack (Max 20 states)
 */

import { SectionId } from '../types';

export const MAX_NAVIGATION_HISTORY = 20;

export class BoundedNavigationHistory {
  private history: SectionId[] = [];
  private pointer = -1;

  public push(section: SectionId): void {
    if (this.pointer >= 0 && this.history[this.pointer] === section) {
      return; // Deduplicate consecutive identical section navigations
    }

    // Truncate any forward history when branching
    if (this.pointer < this.history.length - 1) {
      this.history = this.history.slice(0, this.pointer + 1);
    }

    this.history.push(section);

    // Enforce hard bound <= 20
    if (this.history.length > MAX_NAVIGATION_HISTORY) {
      this.history.shift();
    }

    this.pointer = this.history.length - 1;
  }

  public canGoBack(): boolean {
    return this.pointer > 0;
  }

  public canGoForward(): boolean {
    return this.pointer < this.history.length - 1;
  }

  public goBack(): SectionId | null {
    if (!this.canGoBack()) return null;
    this.pointer--;
    return this.history[this.pointer];
  }

  public goForward(): SectionId | null {
    if (!this.canGoForward()) return null;
    this.pointer++;
    return this.history[this.pointer];
  }

  public getCurrent(): SectionId | null {
    if (this.pointer >= 0 && this.pointer < this.history.length) {
      return this.history[this.pointer];
    }
    return null;
  }

  public getHistory(): readonly SectionId[] {
    return [...this.history];
  }

  public clear(): void {
    this.history = [];
    this.pointer = -1;
  }
}
