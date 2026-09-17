/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.25-J: Workspace Geometry Binding Validator
 *
 * Validates workspace-bound geometry scenes, finite coordinates, bounding boxes,
 * checksum integrity, and cross-space/cross-user access boundaries.
 */

import {
  WorkspaceBoundGeometryScene,
  WorkspaceGeometryValidationReport,
  WorkspaceGeometryValidationStatus,
} from './types';
import { deterministicHash } from './determinism';

export class SceneValidator {
  public static validateScene(
    scene: WorkspaceBoundGeometryScene | null,
    expectedSpaceId?: string,
    expectedOwnerId?: string
  ): WorkspaceGeometryValidationReport {
    const issues: string[] = [];

    if (!scene) {
      return Object.freeze({
        status: 'SPACE_SCENE_NOT_FOUND',
        isValid: false,
        issues: ['Space scene does not exist or was deleted.'],
        objectCount: 0,
        nonManifoldCount: 0,
        reportChecksum: deterministicHash('SPACE_SCENE_NOT_FOUND'),
      });
    }

    if (expectedSpaceId && scene.spaceId !== expectedSpaceId) {
      issues.push(`Cross-space reference violation: scene belongs to ${scene.spaceId}, expected ${expectedSpaceId}`);
      return Object.freeze({
        status: 'CROSS_SPACE_REFERENCE',
        isValid: false,
        issues,
        objectCount: scene.objects.length,
        nonManifoldCount: 0,
        reportChecksum: deterministicHash(issues.join(';')),
      });
    }

    if (expectedOwnerId && scene.ownerId !== expectedOwnerId) {
      issues.push(`Unauthorized geometry access: scene owner ${scene.ownerId} does not match expected ${expectedOwnerId}`);
      return Object.freeze({
        status: 'UNAUTHORIZED_GEOMETRY_ACCESS',
        isValid: false,
        issues,
        objectCount: scene.objects.length,
        nonManifoldCount: 0,
        reportChecksum: deterministicHash(issues.join(';')),
      });
    }

    const seenIds = new Set<string>();
    let nonManifoldCount = 0;

    for (const obj of scene.objects) {
      if (seenIds.has(obj.objectId)) {
        issues.push(`Duplicate geometry object ID detected: ${obj.objectId}`);
      }
      seenIds.add(obj.objectId);

      // Check finite coordinates
      const [x, y, z] = obj.coordinates;
      if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z) || Number.isNaN(x) || Number.isNaN(y) || Number.isNaN(z)) {
        issues.push(`Non-finite coordinates detected in object ${obj.objectId}: [${x}, ${y}, ${z}]`);
      }

      // Check bounds
      const min = obj.bounds.min;
      const max = obj.bounds.max;
      if (
        !Number.isFinite(min[0]) || !Number.isFinite(min[1]) || !Number.isFinite(min[2]) ||
        !Number.isFinite(max[0]) || !Number.isFinite(max[1]) || !Number.isFinite(max[2]) ||
        Number.isNaN(min[0]) || Number.isNaN(min[1]) || Number.isNaN(min[2]) ||
        Number.isNaN(max[0]) || Number.isNaN(max[1]) || Number.isNaN(max[2]) ||
        min[0] > max[0] || min[1] > max[1] || min[2] > max[2]
      ) {
        issues.push(`Invalid non-finite bounding box for object ${obj.objectId}`);
      }

      // Check mesh topology
      if (obj.p66Object.mesh && !obj.p66Object.mesh.isManifold) {
        nonManifoldCount++;
      }
    }

    let status: WorkspaceGeometryValidationStatus = 'WORKSPACE_GEOMETRY_VALID';
    if (issues.some((i) => i.includes('Non-finite'))) {
      status = 'NON_FINITE_GEOMETRY';
    } else if (issues.length > 0) {
      status = 'WORKSPACE_GEOMETRY_INVALID';
    }

    const isValid = issues.length === 0;
    const reportChecksum = deterministicHash(`${status}_${issues.length}_${scene.sceneChecksum}`);

    return Object.freeze({
      status,
      isValid,
      issues: Object.freeze(issues),
      objectCount: scene.objects.length,
      nonManifoldCount,
      reportChecksum,
    });
  }
}
