/**
 * 3D Memory Studio — Funnel 66
 * Panel Registry
 */

import { INITIAL_PANELS } from './panelTypes';
import { PanelDescriptor, SectionId } from '../types';

export class PanelRegistry {
  private readonly panels: Map<SectionId, PanelDescriptor> = new Map();

  constructor() {
    for (const p of INITIAL_PANELS) {
      this.panels.set(p.id, { ...p });
    }
  }

  public getPanel(id: SectionId): PanelDescriptor | undefined {
    return this.panels.get(id);
  }

  public getAll(): readonly PanelDescriptor[] {
    return Array.from(this.panels.values());
  }

  public updatePanel(id: SectionId, partial: Partial<PanelDescriptor>): boolean {
    const existing = this.panels.get(id);
    if (!existing) return false;

    this.panels.set(id, { ...existing, ...partial });
    return true;
  }

  public reset(): void {
    this.panels.clear();
    for (const p of INITIAL_PANELS) {
      this.panels.set(p.id, { ...p });
    }
  }
}
