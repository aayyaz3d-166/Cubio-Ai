/**
 * 3D Memory Studio — Funnel 64
 * Panel Registry
 *
 * Stores and indexes up to 16 registered workspace panels with duplicate rejection.
 */

import { PanelDescriptor, PanelId, PanelCategory } from '../types';
import { STANDARD_PANELS } from './panelState';

export const MAX_REGISTERED_PANELS = 16;

export class PanelRegistry {
  private panels: Map<PanelId, PanelDescriptor> = new Map();

  constructor() {
    this.registerStandardPanels();
  }

  private registerStandardPanels(): void {
    for (const p of STANDARD_PANELS) {
      this.panels.set(p.panelId, { ...p });
    }
  }

  public registerPanel(panel: PanelDescriptor): boolean {
    if (this.panels.size >= MAX_REGISTERED_PANELS) {
      return false; // Hard limit enforced
    }
    if (this.panels.has(panel.panelId)) {
      return false; // Duplicate ID rejection
    }
    this.panels.set(panel.panelId, { ...panel });
    return true;
  }

  public removePanel(panelId: PanelId): boolean {
    return this.panels.delete(panelId);
  }

  public getPanel(panelId: PanelId): PanelDescriptor | undefined {
    return this.panels.get(panelId);
  }

  public hasPanel(panelId: PanelId): boolean {
    return this.panels.has(panelId);
  }

  public getAll(): readonly PanelDescriptor[] {
    return Array.from(this.panels.values()).sort((a, b) => a.order - b.order);
  }

  public getVisiblePanels(): readonly PanelDescriptor[] {
    return this.getAll().filter((p) => p.visible);
  }

  public getActivePanels(): readonly PanelDescriptor[] {
    return this.getAll().filter((p) => p.active);
  }

  public getByCategory(category: PanelCategory): readonly PanelDescriptor[] {
    return this.getAll().filter((p) => p.category === category);
  }

  public clear(): void {
    this.panels.clear();
  }

  public reset(): void {
    this.clear();
    this.registerStandardPanels();
  }

  public get count(): number {
    return this.panels.size;
  }

  public dispose(): void {
    this.clear();
  }
}
