/**
 * 3D Memory Studio — Funnel 70
 * Panel Action Adapter (F66 Integration)
 */

import { SectionId } from '../../funnel66/types';
import { PanelOrchestrator } from '../../funnel66/panels/panelOrchestrator';
import { VALID_SECTIONS } from '../actions/actionTypes';

export class PanelActionAdapter {
  private openPanels: Set<SectionId> = new Set(['DATABASE']);

  constructor(public readonly orchestrator?: PanelOrchestrator) {
    if (this.orchestrator) {
      this.syncFromOrchestrator();
    }
  }

  private syncFromOrchestrator(): void {
    if (!this.orchestrator) return;
    this.openPanels = new Set(this.orchestrator.getOpenPanels());
  }

  public openPanel(panelId: SectionId): boolean {
    if (!VALID_SECTIONS.has(panelId)) return false;
    this.openPanels.add(panelId);
    if (this.orchestrator) {
      return this.orchestrator.openPanel(panelId);
    }
    return true;
  }

  public closePanel(panelId: SectionId): boolean {
    if (!VALID_SECTIONS.has(panelId)) return false;
    this.openPanels.delete(panelId);
    if (this.orchestrator) {
      return this.orchestrator.closePanel(panelId);
    }
    return true;
  }

  public togglePanel(panelId: SectionId): boolean {
    if (!VALID_SECTIONS.has(panelId)) return false;
    if (this.openPanels.has(panelId)) {
      return this.closePanel(panelId);
    } else {
      return this.openPanel(panelId);
    }
  }

  public getOpenPanels(): readonly SectionId[] {
    if (this.orchestrator) {
      return this.orchestrator.getOpenPanels();
    }
    return Array.from(this.openPanels);
  }
}
