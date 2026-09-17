/**
 * 3D Memory Studio — Funnel 65
 * Workspace Runtime Adapter
 */

import { StudioWorkspaceManager } from '../../funnel64/workspace/workspaceManager';
import { DataClassification } from '../../funnel47/types';

export class WorkspaceRuntimeAdapter {
  constructor(public readonly workspace: StudioWorkspaceManager) {}

  public selectTarget(stateId: string, classification: DataClassification): boolean {
    return this.workspace.selectState(stateId, classification);
  }

  public getSelectedTarget(): string | null {
    return this.workspace.selectionManager.currentStateId;
  }
}
