/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.25-I: Safe Workspace Persistence Adapter
 *
 * Enforces undefined-value protection, validation before writing,
 * and deterministic persistence storage.
 */

import { LiveWorkspaceState, LiveSpaceState, LiveSavedState } from './types';
import { deterministicHash } from './workspaceEvents';

export class WorkspacePersistenceAdapter {
  private static sharedInMemoryStorage = new Map<string, string>();

  public saveWorkspace(workspace: LiveWorkspaceState): { success: boolean; checksum: string; error?: string } {
    try {
      const sanitized = this.stripUndefined(workspace);
      const payload = JSON.stringify(sanitized);

      // Validate payload
      if (payload.includes('undefined')) {
        return { success: false, checksum: '', error: 'PERSISTENCE_REJECTED: Undefined value detected in payload' };
      }

      const checksum = deterministicHash(payload);
      WorkspacePersistenceAdapter.sharedInMemoryStorage.set(`WS_${workspace.workspaceId}`, payload);

      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(`3D_STUDIO_WS_${workspace.workspaceId}`, payload);
      }

      return { success: true, checksum };
    } catch (err: any) {
      return { success: false, checksum: '', error: err.message };
    }
  }

  public loadWorkspace(workspaceId: string): LiveWorkspaceState | null {
    let payload = WorkspacePersistenceAdapter.sharedInMemoryStorage.get(`WS_${workspaceId}`);

    if (!payload && typeof window !== 'undefined' && window.localStorage) {
      payload = window.localStorage.getItem(`3D_STUDIO_WS_${workspaceId}`) ?? undefined;
    }

    if (!payload) return null;

    try {
      const parsed = JSON.parse(payload);
      if (!parsed || typeof parsed !== 'object') return null;
      if (parsed.spaces && !Array.isArray(parsed.spaces)) return null;

      return Object.freeze({
        workspaceId: parsed.workspaceId,
        activeSpaceId: parsed.activeSpaceId ?? null,
        spaces: Object.freeze(parsed.spaces ?? []),
        experiments: Object.freeze(parsed.experiments ?? []),
        savedStates: Object.freeze(parsed.savedStates ?? []),
        recentViews: Object.freeze(parsed.recentViews ?? []),
        selectedObjectId: parsed.selectedObjectId ?? null,
        isDirty: false,
        currentChecksum: parsed.currentChecksum ?? deterministicHash(payload),
      });
    } catch {
      return null;
    }
  }

  public stripUndefined<T>(obj: T): T {
    if (obj === null || obj === undefined) return obj;
    return JSON.parse(JSON.stringify(obj, (_, v) => (v === undefined ? null : v)));
  }

  public static clearStorage(): void {
    WorkspacePersistenceAdapter.sharedInMemoryStorage.clear();
  }
}
