/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel F11: R6 Read-Only Adapter
 *
 * Ingests user workspace objects, camera state, and selection states from R6.
 * Invariant: ΔReality = 0.
 */

import { WorkspaceState, WorkspaceObjectBinding } from '../r6/types';

export class F11R6Adapter {
  public static extractWorkspaceObjects(
    workspaceState: WorkspaceState
  ): readonly WorkspaceObjectBinding[] {
    return Object.values(workspaceState.objects);
  }

  public static getActiveSelection(
    workspaceState: WorkspaceState
  ): string | null {
    return workspaceState.selection.selectedId || null;
  }
}
