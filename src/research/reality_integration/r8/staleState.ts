/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R8: Stale State Detector
 *
 * Detects SYNCED / STALE / RESYNCED between authoritative Reality and R8 interaction state.
 */

import { InteractionStaleState } from './types';

export class R8StaleStateEngine {
  public static evaluateSync(
    currentRealityChecksum: string,
    lastSyncedRealityChecksum: string
  ): InteractionStaleState {
    if (!currentRealityChecksum || !lastSyncedRealityChecksum) return 'INVALID';
    return currentRealityChecksum === lastSyncedRealityChecksum ? 'SYNCED' : 'STALE';
  }

  public static afterResync(
    currentRealityChecksum: string,
    newSyncedChecksum: string
  ): InteractionStaleState {
    return currentRealityChecksum === newSyncedChecksum ? 'RESYNCED' : 'STALE';
  }
}
