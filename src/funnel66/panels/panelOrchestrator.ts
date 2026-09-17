/**
 * 3D Memory Studio — Funnel 66
 * Panel Orchestrator
 */

import { PanelRegistry } from './panelRegistry';
import { MAX_OPEN_PANELS } from './panelTypes';
import { SectionId } from '../types';

export class PanelOrchestrator {
  public readonly registry: PanelRegistry;
  private openPanels: SectionId[] = [];
  private activePanel: SectionId | null = null;

  constructor(registry?: PanelRegistry) {
    this.registry = registry ?? new PanelRegistry();
  }

  public openPanel(id: SectionId): boolean {
    if (this.openPanels.includes(id)) {
      this.activatePanel(id);
      return true;
    }

    if (this.openPanels.length >= MAX_OPEN_PANELS) {
      // Close oldest panel to preserve bound <= 8
      const oldest = this.openPanels.shift();
      if (oldest) {
        this.registry.updatePanel(oldest, { mode: 'CLOSED' });
      }
    }

    this.openPanels.push(id);
    this.registry.updatePanel(id, { mode: 'OPEN' });
    this.activePanel = id;
    return true;
  }

  public closePanel(id: SectionId): boolean {
    const idx = this.openPanels.indexOf(id);
    if (idx === -1) return false;

    this.openPanels.splice(idx, 1);
    this.registry.updatePanel(id, { mode: 'CLOSED' });

    if (this.activePanel === id) {
      this.activePanel = this.openPanels.length > 0 ? this.openPanels[this.openPanels.length - 1] : null;
    }

    return true;
  }

  public togglePanel(id: SectionId): boolean {
    if (this.openPanels.includes(id)) {
      return this.closePanel(id);
    } else {
      return this.openPanel(id);
    }
  }

  public minimizePanel(id: SectionId): boolean {
    if (!this.openPanels.includes(id)) return false;
    this.registry.updatePanel(id, { mode: 'MINIMIZED' });
    return true;
  }

  public maximizePanel(id: SectionId): boolean {
    if (!this.openPanels.includes(id)) {
      this.openPanel(id);
    }
    this.registry.updatePanel(id, { mode: 'MAXIMIZED' });
    this.activePanel = id;
    return true;
  }

  public activatePanel(id: SectionId): boolean {
    if (!this.openPanels.includes(id)) {
      return this.openPanel(id);
    }
    this.activePanel = id;
    return true;
  }

  public closeAllPanels(): void {
    for (const p of this.openPanels) {
      this.registry.updatePanel(p, { mode: 'CLOSED' });
    }
    this.openPanels = [];
    this.activePanel = null;
  }

  public getActivePanel(): SectionId | null {
    return this.activePanel;
  }

  public getOpenPanels(): readonly SectionId[] {
    return [...this.openPanels];
  }

  public isPanelOpen(id: SectionId): boolean {
    return this.openPanels.includes(id);
  }
}
