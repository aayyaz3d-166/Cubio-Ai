/**
 * CubiO — Universal Spatial Operating Environment
 * Phase 10: CubiO Shared Space Manager
 *
 * Manages shared multi-user spatial spaces, permissions, and participant memberships.
 */

import { CubiODimension } from '../types';
import { CubiOState } from '../state/types';
import { deterministicHash } from '../state/determinism';
import { SharedCubiOSpace, SpacePermissions, StateSyncDelta } from './types';

export class CubiOSharedSpaceManager {
  /**
   * Creates a new shared multi-user CubiO space.
   */
  public static createSpace(
    spaceName: string,
    ownerPeerId: string,
    dimension: CubiODimension = 'D3',
    initialStates: readonly CubiOState[] = [],
    permissions?: Partial<SpacePermissions>,
    harmonicTuningHz = 369.0
  ): Readonly<SharedCubiOSpace> {
    const spaceId = `SPACE_${deterministicHash(spaceName + ownerPeerId).slice(2, 10)}`;
    const now = Date.now();

    const fullPermissions: SpacePermissions = Object.freeze({
      ownerId: ownerPeerId,
      allowedActors: permissions?.allowedActors || ['*'],
      canMutateState: permissions?.canMutateState || ['*'],
      canInvite: permissions?.canInvite || [ownerPeerId],
      canInvokeAI: permissions?.canInvokeAI || ['*'],
    });

    const vectorClock: Record<string, number> = { [ownerPeerId]: 1 };
    const spaceChecksum = deterministicHash(
      `${spaceId}:${dimension}:${initialStates.map((s) => s.checksum).join('|')}`
    );

    return Object.freeze({
      spaceId,
      spaceName,
      dimension,
      ownerPeerId,
      participantPeerIds: Object.freeze([ownerPeerId]),
      permissions: fullPermissions,
      activeStates: Object.freeze([...initialStates]),
      harmonicTuningHz,
      vectorClock: Object.freeze(vectorClock),
      spaceChecksum,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * Adds a peer to a shared space after verifying access permissions.
   */
  public static joinSpace(
    space: SharedCubiOSpace,
    peerId: string
  ): Readonly<SharedCubiOSpace> {
    if (space.participantPeerIds.includes(peerId)) return space;

    if (!this.checkPermission(space, peerId, 'INVITE')) {
      throw new Error(`Peer '${peerId}' is not authorized to join space '${space.spaceId}'.`);
    }

    const updatedParticipants = [...space.participantPeerIds, peerId];
    const updatedClock = { ...space.vectorClock, [peerId]: 1 };

    return Object.freeze({
      ...space,
      participantPeerIds: Object.freeze(updatedParticipants),
      vectorClock: Object.freeze(updatedClock),
      updatedAt: Date.now(),
    });
  }

  /**
   * Applies a state sync mutation delta to the shared space.
   */
  public static applyDelta(
    space: SharedCubiOSpace,
    delta: StateSyncDelta
  ): Readonly<SharedCubiOSpace> {
    if (!this.checkPermission(space, delta.originPeerId, 'MUTATE')) {
      throw new Error(`Peer '${delta.originPeerId}' unauthorized to mutate state in space '${space.spaceId}'.`);
    }

    const updatedStates = space.activeStates.map((state) => {
      if (state.id !== delta.stateId) return state;

      const newPosition = delta.updatedPosition || state.position;
      const newProps = delta.updatedProperties
        ? { ...state.properties, ...delta.updatedProperties }
        : state.properties;
      const newDimension = delta.targetDimension || state.dimension;

      const checksum = deterministicHash(
        `${state.id}:${newDimension}:[${newPosition.join(',')}]`
      );

      return Object.freeze({
        ...state,
        position: Object.freeze(newPosition),
        dimension: newDimension,
        properties: Object.freeze(newProps),
        checksum,
      });
    });

    const currentSeq = space.vectorClock[delta.originPeerId] || 0;
    const updatedClock = { ...space.vectorClock, [delta.originPeerId]: currentSeq + 1 };

    const spaceChecksum = deterministicHash(
      `${space.spaceId}:${space.dimension}:${updatedStates.map((s) => s.checksum).join('|')}`
    );

    return Object.freeze({
      ...space,
      activeStates: Object.freeze(updatedStates),
      vectorClock: Object.freeze(updatedClock),
      spaceChecksum,
      updatedAt: Date.now(),
    });
  }

  /**
   * Verifies if a peer is allowed to execute a given action in the space.
   */
  public static checkPermission(
    space: SharedCubiOSpace,
    peerId: string,
    action: 'MUTATE' | 'INVITE' | 'AI'
  ): boolean {
    if (peerId === space.ownerPeerId) return true;

    const perms = space.permissions;
    if (action === 'MUTATE') {
      return perms.canMutateState.includes('*') || perms.canMutateState.includes(peerId);
    }
    if (action === 'INVITE') {
      return perms.allowedActors.includes('*') || perms.allowedActors.includes(peerId);
    }
    if (action === 'AI') {
      return perms.canInvokeAI.includes('*') || perms.canInvokeAI.includes(peerId);
    }

    return false;
  }
}
