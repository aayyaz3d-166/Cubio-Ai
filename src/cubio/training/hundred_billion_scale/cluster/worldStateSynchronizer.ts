/**
 * CubiO — Step 86 World State Synchronizer
 */

import { deterministicHash } from '../../../state/determinism';

export class WorldStateSynchronizer {
  public static computeWorldStateHash(worldSize: number, activeRanks: readonly number[], globalStep: number): string {
    const sorted = [...activeRanks].sort((a, b) => a - b);
    return deterministicHash(`WORLD_SIZE_${worldSize}_ACTIVE_${sorted.join(',')}_STEP_${globalStep}`);
  }
}
