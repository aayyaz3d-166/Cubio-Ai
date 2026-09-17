/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.14: Search Navigation Engine
 *
 * Resolves search result selections to target workspace entities.
 * Enforces access permissions on navigation.
 * Navigation and UI camera updates do NOT duplicate, mutate, or alter
 * Reality, Model, or Geometry truth.
 */

import {
  WorkspaceIndex,
  SearchAccessContext,
  SearchNavigationTarget,
  IndexedEntity,
} from './types';
import { AccessFilter } from './accessFilter';
import {
  generateDeterministicNavigationId,
  deterministicHash,
} from './determinism';

export class WorkspaceNavigationEngine {
  /**
   * Resolve an entity navigation request.
   */
  public static navigateToEntity(
    targetEntityId: string,
    index: WorkspaceIndex,
    accessContext: SearchAccessContext
  ): SearchNavigationTarget {
    const entity = index.entities.find((e) => e.entityId === targetEntityId);

    if (!entity) {
      const navigationId = generateDeterministicNavigationId(
        accessContext.userId,
        targetEntityId
      );
      const raw = JSON.stringify([navigationId, targetEntityId, 'TARGET_NOT_FOUND']);
      return Object.freeze({
        navigationId,
        targetEntityId,
        targetEntityType: 'SPACE',
        status: 'TARGET_NOT_FOUND',
        navigationChecksum: deterministicHash(raw),
      });
    }

    // Verify access permission
    const isAllowed = AccessFilter.isAccessible(entity, accessContext);
    if (!isAllowed) {
      const navigationId = generateDeterministicNavigationId(
        accessContext.userId,
        targetEntityId
      );
      const raw = JSON.stringify([navigationId, targetEntityId, 'BLOCKED_UNAUTHORIZED']);
      return Object.freeze({
        navigationId,
        targetEntityId,
        targetEntityType: entity.entityType,
        status: 'BLOCKED_UNAUTHORIZED',
        navigationChecksum: deterministicHash(raw),
      });
    }

    const navigationId = generateDeterministicNavigationId(
      accessContext.userId,
      targetEntityId
    );

    // Compute UI camera viewport coordinates if geometry/object coordinates exist
    let cameraAction: SearchNavigationTarget['cameraAction'];
    if (entity.coordinates) {
      const [x, y, z] = entity.coordinates;
      cameraAction = {
        cameraPosition: Object.freeze([x + 10, y + 10, z + 10]) as [number, number, number],
        cameraTarget: Object.freeze([x, y, z]) as [number, number, number],
      };
    }

    const raw = JSON.stringify([
      navigationId,
      entity.entityId,
      entity.entityType,
      entity.spaceId ?? null,
      entity.experimentId ?? null,
      entity.versionId ?? null,
      entity.stateId ?? null,
      cameraAction ?? null,
      'NAVIGATED',
    ]);
    const navigationChecksum = deterministicHash(raw);

    return Object.freeze({
      navigationId,
      targetEntityId: entity.entityId,
      targetEntityType: entity.entityType,
      targetSpaceId: entity.spaceId,
      targetExperimentId: entity.experimentId,
      targetVersionId: entity.versionId,
      targetStateId: entity.stateId,
      targetObjectId: entity.entityType.includes('OBJECT') ? entity.entityId : undefined,
      cameraAction: cameraAction ? Object.freeze({ ...cameraAction }) : undefined,
      status: 'NAVIGATED',
      navigationChecksum,
    });
  }
}
