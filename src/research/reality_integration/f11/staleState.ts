/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel F11: Stale State Detection Engine
 *
 * Tracks live synchronization with upstream Reality and Workspace representations.
 */

import { WorldModelSyncStatus, WorldModel } from './types';

export class F11StaleStateEngine {
  public static evaluateSyncStatus(
    model: WorldModel,
    currentRealityChecksum: string,
    currentWorkspaceChecksum: string
  ): WorldModelSyncStatus {
    if (model.realityChecksum !== currentRealityChecksum) {
      return 'STALE';
    }

    if (model.workspaceChecksum !== currentWorkspaceChecksum) {
      return 'RESYNC_REQUIRED';
    }

    return 'SYNCED';
  }
}
