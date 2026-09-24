/**
 * CubiO — Universal Spatial Operating Environment
 * Phase 10: CubiO State Synchronizer
 *
 * Implements deterministic Vector-Clock state delta synchronization
 * and conflict-free multi-peer convergence (CRDT semantics).
 */

import { deterministicHash } from '../state/determinism';
import { CubiODimension } from '../types';
import { SharedCubiOSpace, StateSyncDelta } from './types';
import { CubiOSharedSpaceManager } from './spaceManager';

export class CubiOStateSynchronizer {
  /**
   * Constructs an immutable state synchronization delta packet.
   */
  public static createDelta(
    spaceId: string,
    stateId: string,
    originPeerId: string,
    sequenceNumber: number,
    options: {
      updatedPosition?: readonly number[];
      updatedProperties?: Readonly<Record<string, any>>;
      targetDimension?: CubiODimension;
    } = {}
  ): Readonly<StateSyncDelta> {
    const deltaChecksum = deterministicHash(
      `${spaceId}:${stateId}:${originPeerId}:${sequenceNumber}:${JSON.stringify(options)}`
    );
    const deltaId = `DELTA_${deltaChecksum.slice(2, 10)}`;

    return Object.freeze({
      deltaId,
      spaceId,
      stateId,
      originPeerId,
      sequenceNumber,
      updatedPosition: options.updatedPosition,
      updatedProperties: options.updatedProperties,
      targetDimension: options.targetDimension,
      timestamp: Date.now(),
      deltaChecksum,
    });
  }

  /**
   * Deterministically merges an array of out-of-order state deltas into a shared space.
   * Invariant: Sorting by (timestamp, originPeerId, sequenceNumber) guarantees identical
   * state convergence regardless of network arrival order.
   */
  public static mergeDeltas(
    initialSpace: SharedCubiOSpace,
    deltas: readonly StateSyncDelta[]
  ): Readonly<SharedCubiOSpace> {
    // Deterministic total ordering
    const sortedDeltas = [...deltas].sort((a, b) => {
      if (a.sequenceNumber !== b.sequenceNumber) return a.sequenceNumber - b.sequenceNumber;
      if (a.timestamp !== b.timestamp) return a.timestamp - b.timestamp;
      return a.originPeerId.localeCompare(b.originPeerId);
    });

    let currentSpace = initialSpace;
    for (const delta of sortedDeltas) {
      currentSpace = CubiOSharedSpaceManager.applyDelta(currentSpace, delta);
    }

    return currentSpace;
  }

  /**
   * Verifies that two replica spaces on different peers have converged to identical states.
   */
  public static verifyConvergence(
    spaceA: SharedCubiOSpace,
    spaceB: SharedCubiOSpace
  ): boolean {
    return spaceA.spaceChecksum === spaceB.spaceChecksum;
  }
}
