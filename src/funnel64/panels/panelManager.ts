/**
 * 3D Memory Studio — Funnel 64
 * Panel Manager & Bounded Lifecycle Coordinator
 */

import { PanelId, PanelDescriptor } from '../types';
import { PanelRegistry } from './panelRegistry';

export const MAX_VISIBLE_PANELS = 8;
export const MAX_ACTIVE_PANELS = 4;
export const MAX_PANEL_HISTORY = 20;

export class PanelManager {
  private history: PanelId[] = [];

  constructor(public readonly registry: PanelRegistry) {}

  public openPanel(panelId: PanelId): boolean {
    const panel = this.registry.getPanel(panelId);
    if (!panel) return false;

    const visibleCount = this.registry.getVisiblePanels().length;
    if (!panel.visible && visibleCount >= MAX_VISIBLE_PANELS) {
      return false; // Limit reached
    }

    panel.visible = true;
    this.activatePanel(panelId);
    this.recordHistory(panelId);
    return true;
  }

  public closePanel(panelId: PanelId): boolean {
    const panel = this.registry.getPanel(panelId);
    if (!panel) return false;

    panel.visible = false;
    panel.active = false;
    return true;
  }

  public togglePanel(panelId: PanelId): boolean {
    const panel = this.registry.getPanel(panelId);
    if (!panel) return false;

    if (panel.visible && panel.active) {
      return this.closePanel(panelId);
    } else {
      return this.openPanel(panelId);
    }
  }

  public activatePanel(panelId: PanelId): boolean {
    const panel = this.registry.getPanel(panelId);
    if (!panel || !panel.visible) return false;

    const activePanels = this.registry.getActivePanels();
    if (!panel.active && activePanels.length >= MAX_ACTIVE_PANELS) {
      // Deactivate lowest order active panel
      const oldest = activePanels[0];
      if (oldest) oldest.active = false;
    }

    panel.active = true;
    return true;
  }

  public deactivatePanel(panelId: PanelId): boolean {
    const panel = this.registry.getPanel(panelId);
    if (!panel) return false;

    panel.active = false;
    return true;
  }

  public resizePanel(panelId: PanelId, width: number): boolean {
    const panel = this.registry.getPanel(panelId);
    if (!panel) return false;

    panel.width = Math.max(panel.minWidth, Math.min(panel.maxWidth, width));
    return true;
  }

  public closeAllPanels(): void {
    for (const p of this.registry.getAll()) {
      p.visible = false;
      p.active = false;
    }
  }

  private recordHistory(panelId: PanelId): void {
    this.history.push(panelId);
    if (this.history.length > MAX_PANEL_HISTORY) {
      this.history.shift();
    }
  }

  public get historyStack(): readonly PanelId[] {
    return [...this.history];
  }
}
