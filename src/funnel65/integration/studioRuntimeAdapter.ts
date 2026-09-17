/**
 * 3D Memory Studio — Funnel 65
 * Studio Runtime Adapter
 */

import { StudioWorkspaceManager } from '../../funnel64/workspace/workspaceManager';

export class StudioRuntimeAdapter {
  constructor(public readonly workspace: StudioWorkspaceManager) {}

  public isWorkspaceReady(): boolean {
    return this.workspace.stateMachine.mode === 'READY';
  }

  public getActiveDimension(): number {
    return this.workspace.dimensionAdapter.activeDimension;
  }
}
