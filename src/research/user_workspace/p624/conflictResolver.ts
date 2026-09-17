/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.24: Deterministic Conflict Resolver
 *
 * Resolves prospective import conflicts using explicit deterministic strategies:
 * REJECT, SKIP, or IMPORT_AS_NEW_LINEAGE.
 */

import {
  PackageEntity,
  ImportConflict,
  ImportOptions,
} from './types';
import { deterministicHash } from './determinism';

export class ConflictResolver {
  public static applyResolution(
    incomingEntities: readonly PackageEntity[],
    conflicts: readonly ImportConflict[],
    options?: ImportOptions
  ): {
    resolvedEntities: readonly PackageEntity[];
    status: 'RESOLVED' | 'IMPORT_BLOCKED';
    error?: string;
  } {
    const strategy = options?.conflictStrategy ?? 'REJECT';

    if (conflicts.length === 0) {
      return { resolvedEntities: incomingEntities, status: 'RESOLVED' };
    }

    const collisionConflicts = conflicts.filter((c) => c.conflictType === 'ID_COLLISION');

    if (strategy === 'REJECT' && collisionConflicts.length > 0) {
      return {
        resolvedEntities: Object.freeze([]),
        status: 'IMPORT_BLOCKED',
        error: `Import blocked due to ${collisionConflicts.length} unhandled ID collisions.`,
      };
    }

    const skipIds = new Set<string>();
    const remappedEntities: PackageEntity[] = [];

    if (strategy === 'SKIP') {
      conflicts.forEach((c) => skipIds.add(c.entityId));
      incomingEntities.forEach((e) => {
        if (!skipIds.has(e.entityId)) {
          remappedEntities.push(e);
        }
      });
      return { resolvedEntities: Object.freeze(remappedEntities), status: 'RESOLVED' };
    }

    if (strategy === 'IMPORT_AS_NEW_LINEAGE') {
      incomingEntities.forEach((e) => {
        const hasCollision = collisionConflicts.some((c) => c.entityId === e.entityId);
        if (hasCollision) {
          const newLineageId = `LIN_NEW_${deterministicHash(`${e.entityId}_${e.checksum}`)}`;
          const newEntityId = `${e.entityId}_FORK_${deterministicHash(newLineageId).slice(0, 4)}`;
          remappedEntities.push(
            Object.freeze({
              ...e,
              entityId: newEntityId,
              lineageId: newLineageId,
            })
          );
        } else {
          remappedEntities.push(e);
        }
      });
      return { resolvedEntities: Object.freeze(remappedEntities), status: 'RESOLVED' };
    }

    return {
      resolvedEntities: Object.freeze([]),
      status: 'IMPORT_BLOCKED',
      error: 'Unrecognized conflict strategy',
    };
  }
}
