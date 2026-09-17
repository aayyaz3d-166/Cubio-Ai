/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.13: Version Restore Engine
 *
 * Reconstructs active Workspace state from historical versions without mutating history.
 */

import { PersonalSpace } from '../p68/types';
import { WorkspaceVersion, RestoreResult } from './types';
import { VersionManager } from './versionManager';
import { generateDeterministicEventId } from './determinism';

export class RestoreEngine {
  public static restoreVersion(
    versionToRestore: WorkspaceVersion,
    currentSpace: PersonalSpace,
    versionManager: VersionManager
  ): { restoredSpace: PersonalSpace; result: RestoreResult } {
    const payload = versionToRestore.statePayload;

    // Reconstruct objects from payload
    const restoredObjects = payload.objects.map((o) =>
      Object.freeze({
        id: o.id,
        label: o.label,
        position: Object.freeze([...o.position]) as unknown as [number, number, number],
        category: o.category,
        color: '#00F0FF',
        radius: 0.5,
        isCanonicalCopy: false,
        metadata: Object.freeze({}),
      })
    );

    const restoredReality = Object.freeze({
      ...currentSpace.reality,
      objects: Object.freeze(restoredObjects),
      realityChecksum: payload.realityChecksum,
    });

    const restoredObservers = payload.observers.map((obs) =>
      Object.freeze({
        observerId: obs.observerId,
        position: Object.freeze([...obs.position]) as unknown as [number, number, number],
        target: Object.freeze([...obs.target]) as unknown as [number, number, number],
        fov: obs.fov,
        certainty: (obs.certainty || 'EXACT') as any,
      })
    );

    const restoredSpace: PersonalSpace = Object.freeze({
      ...currentSpace,
      reality: restoredReality,
      observers: Object.freeze(restoredObservers),
      dimension: Object.freeze({
        dimensionType: payload.dimension.dimensionType as any,
        activeDimensions: payload.dimension.activeDimensions,
        projectionSignature: 'RESTORED_SIG',
      }),
      view: Object.freeze({
        cameraPosition: Object.freeze([...payload.view.cameraPosition]) as unknown as [number, number, number],
        cameraTarget: Object.freeze([...payload.view.targetPosition]) as unknown as [number, number, number],
        zoom: payload.view.zoom,
        viewportMode: payload.view.viewportMode as any,
        selectedObjectId: null,
      }),
      spaceChecksum: payload.stateChecksum,
      updatedAt: 0,
    });

    // Create a new RESTORE_POINT version referencing the restored version as parent
    const { version: newVersion } = versionManager.createVersion(
      restoredSpace,
      'RESTORE_POINT',
      versionToRestore.versionId,
      `Restored state from version ${versionToRestore.versionId}`,
      versionToRestore.workspaceId,
      true
    );

    const restoreEventId = generateDeterministicEventId(
      versionToRestore.workspaceId,
      newVersion.versionId,
      'RESTORE'
    );

    const result: RestoreResult = Object.freeze({
      success: true,
      restoredVersionId: versionToRestore.versionId,
      newVersion,
      restoredState: payload,
      restoreEventId,
    });

    return { restoredSpace, result };
  }
}
