/**
 * 3D Memory Studio — Funnel 65
 * Panel Runtime Adapter
 */

import { StudioWorkspaceManager } from '../../funnel64/workspace/workspaceManager';
import { PanelId } from '../../funnel64/types';

export class PanelRuntimeAdapter {
  constructor(public readonly workspace: StudioWorkspaceManager) {}

  public openPanel(panelId: PanelId): boolean {
    return this.workspace.panelManager.openPanel(panelId);
  }

  public closePanel(panelId: PanelId): boolean {
    return this.workspace.panelManager.closePanel(panelId);
  }

  public isPanelVisible(panelId: PanelId): boolean {
    return this.workspace.panelRegistry.getPanel(panelId)?.visible ?? false;
  }

  public isViewportAlive(): boolean {
    const b = this.workspace.viewportAdapter.getViewportBounds();
    return b.width > 0 && b.height > 0;
  }
}
