/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R7: Stale State Detection Engine
 *
 * Evaluates live synchronization status between authoritative Reality and downstream R7 scene.
 */

import { R7LiveSyncStatus } from './types';

export class StaleStateEngine {
  public static evaluateSync(
    currentRealityChecksum: string,
    lastSyncedRealityChecksum: string,
    isSyncing = false,
    hasError = false
  ): R7LiveSyncStatus {
    if (hasError) return 'ERROR';
    if (isSyncing) return 'SYNCING';
    if (currentRealityChecksum !== lastSyncedRealityChecksum) return 'STALE';
    return 'SYNCED';
  }
}
