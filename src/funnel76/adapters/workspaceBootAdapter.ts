/**
 * 3D Memory Studio — Funnel 76
 * Workspace Boot Adapter (F66/F64 Integration)
 */

import { StudioWorkspaceManager } from '../../funnel64/workspace/workspaceManager';

export class WorkspaceBootAdapter {
  public async checkReadiness(manager?: StudioWorkspaceManager): Promise<{ ready: boolean; error?: string }> {
    try {
      const activeManager = manager ?? new StudioWorkspaceManager();
      if (activeManager.stateMachine.mode !== 'READY') {
        await activeManager.initialize();
      }
      const isReady = activeManager.stateMachine.mode === 'READY';
      return {
        ready: isReady,
        error: isReady ? undefined : 'StudioWorkspaceManager failed to reach READY state',
      };
    } catch (err: any) {
      return { ready: false, error: err?.message || 'Workspace check failed' };
    }
  }
}
