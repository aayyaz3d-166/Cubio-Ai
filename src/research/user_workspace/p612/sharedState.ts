/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.12: Shared Workspace State Extractor
 *
 * Serializes and exposes only permitted Space state to authorized members.
 */

import { PersonalSpace } from '../p68/types';
import { SpaceShare, WorkspaceMember, SharedWorkspaceState } from './types';
import { deterministicHash } from './determinism';
import { PermissionEngine } from './permissions';

export class SharedStateEngine {
  public static extractSharedState(
    share: SpaceShare,
    space: PersonalSpace,
    requester: WorkspaceMember | null | undefined
  ): SharedWorkspaceState {
    if (!requester || share.status === 'REVOKED') {
      if (requester?.accessLevel !== 'OWNER') {
        throw new Error('Access denied: SpaceShare is revoked or member lacks access.');
      }
    }

    PermissionEngine.assertCanPerformAction(requester, 'canReadState');

    if (share.spaceId !== space.spaceId) {
      throw new Error(`Space mismatch: share (${share.spaceId}) !== space (${space.spaceId})`);
    }

    // Extract sanitized state
    const objects = Object.freeze(
      space.reality.objects.map((obj) =>
        Object.freeze({
          id: obj.id,
          label: obj.label,
          position: Object.freeze([...obj.position]),
          category: obj.category,
        })
      )
    );

    const observers = Object.freeze(
      space.observers.map((obs) =>
        Object.freeze({
          observerId: obs.observerId,
          position: Object.freeze([...obs.position]),
          target: Object.freeze([...obs.target]),
          fov: obs.fov,
          certainty: obs.certainty,
        })
      )
    );

    const dimension = Object.freeze({
      dimensionType: space.dimension.dimensionType,
      activeDimensions: Object.freeze([space.dimension.activeDimensions]),
    });

    const view = Object.freeze({
      cameraPosition: Object.freeze([...space.view.cameraPosition]) as unknown as [number, number, number],
      targetPosition: Object.freeze([...space.view.cameraTarget]) as unknown as [number, number, number],
      zoom: space.view.zoom,
      viewportMode: space.view.viewportMode,
    });

    const raw = JSON.stringify([
      share.shareId,
      space.spaceId,
      space.reality.realityChecksum,
      objects,
      observers,
      dimension,
      view,
    ]);
    const sharedStateChecksum = deterministicHash(raw);

    return Object.freeze({
      shareId: share.shareId,
      spaceId: space.spaceId,
      realityChecksum: space.reality.realityChecksum,
      objects,
      observers,
      dimension,
      view,
      sharedAt: 0,
      sharedStateChecksum,
    });
  }
}
