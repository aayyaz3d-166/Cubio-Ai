/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.24: Identity & Lineage Resolver
 *
 * Checks prospective import entities against existing workspace state
 * to detect ID collisions and lineage conflicts.
 */

import {
  PackageEntity,
  ImportConflict,
} from './types';
import { generateDeterministicConflictId } from './determinism';

export class IdentityResolver {
  public static resolveEntities(
    incomingEntities: readonly PackageEntity[],
    existingEntities: readonly PackageEntity[]
  ): { conflicts: readonly ImportConflict[]; hasCollisions: boolean } {
    const conflicts: ImportConflict[] = [];
    const existingMap = new Map<string, PackageEntity>();
    existingEntities.forEach((e) => existingMap.set(e.entityId, e));

    incomingEntities.forEach((incoming) => {
      const existing = existingMap.get(incoming.entityId);
      if (existing) {
        if (existing.checksum !== incoming.checksum || existing.lineageId !== incoming.lineageId) {
          const conflictId = generateDeterministicConflictId(incoming.entityId, 'ID_COLLISION');
          conflicts.push(
            Object.freeze({
              conflictId,
              entityId: incoming.entityId,
              entityType: incoming.entityType,
              conflictType: 'ID_COLLISION',
              description: `Entity ${incoming.entityId} already exists in workspace with divergent checksum or lineage.`,
              suggestedResolution: 'IMPORT_AS_NEW_LINEAGE',
            })
          );
        } else {
          // Identical existing entity -> SKIP
          const conflictId = generateDeterministicConflictId(incoming.entityId, 'DUPLICATE_ENTITY');
          conflicts.push(
            Object.freeze({
              conflictId,
              entityId: incoming.entityId,
              entityType: incoming.entityType,
              conflictType: 'DUPLICATE_ENTITY',
              description: `Entity ${incoming.entityId} is identical to existing workspace entity.`,
              suggestedResolution: 'SKIP',
            })
          );
        }
      }
    });

    return {
      conflicts: Object.freeze(conflicts),
      hasCollisions: conflicts.some((c) => c.conflictType === 'ID_COLLISION'),
    };
  }
}
