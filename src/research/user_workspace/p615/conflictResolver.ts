/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.15: Import Conflict Detection & Resolution Engine
 *
 * Classifies entity and identity collisions between incoming package and existing workspace.
 * Resolves collisions explicitly via REJECT, SKIP, or CREATE_NEW_LINEAGE without silent overwrites.
 */

import {
  WorkspaceExportPackage,
  ImportConflict,
  ImportResolution,
  ConflictType,
  ConflictResolutionStrategy,
} from './types';
import {
  generateDeterministicConflictId,
  generateDeterministicResolutionId,
  generateDeterministicNewLineageId,
  generateDeterministicNewEntityId,
  deterministicHash,
} from './determinism';

export class ConflictResolver {
  /**
   * Detect collisions between incoming package entities and existing workspace state IDs/checksums.
   */
  public static detectConflicts(
    incomingPkg: WorkspaceExportPackage,
    existingEntities: ReadonlyMap<string, { checksum: string; lineageId: string; ownerId: string }>
  ): readonly ImportConflict[] {
    const conflicts: ImportConflict[] = [];

    const checkEntity = (entityId: string, incomingChecksum: string, incomingLineage: string, type: ConflictType) => {
      if (existingEntities.has(entityId)) {
        const existing = existingEntities.get(entityId)!;
        let conflictType: ConflictType = type;

        if (existing.checksum !== incomingChecksum) {
          conflictType = 'CHECKSUM_CONFLICT';
        } else if (existing.lineageId !== incomingLineage) {
          conflictType = 'LINEAGE_CONFLICT';
        }

        const conflictId = generateDeterministicConflictId(entityId, conflictType);
        conflicts.push(
          Object.freeze({
            conflictId,
            conflictType,
            entityId,
            existingChecksum: existing.checksum,
            incomingChecksum,
            description: `Entity ${entityId} collides with existing workspace record (${conflictType})`,
          })
        );
      }
    };

    incomingPkg.spaces?.forEach((s) => checkEntity(s.spaceId, s.checksum, s.lineageId, 'DUPLICATE_SPACE_ID'));
    incomingPkg.experiments?.forEach((e) => checkEntity(e.experimentId, e.checksum, e.lineageId, 'DUPLICATE_EXPERIMENT_ID'));
    incomingPkg.savedStates?.forEach((st) => checkEntity(st.stateId, st.checksum, st.lineageId, 'DUPLICATE_STATE_ID'));
    incomingPkg.versions?.forEach((v) => checkEntity(v.versionId, v.checksum, v.lineageId, 'DUPLICATE_VERSION_ID'));
    incomingPkg.models?.forEach((m) => checkEntity(m.modelId, m.modelChecksum, 'LIN_DEFAULT', 'DUPLICATE_MODEL_ID'));
    incomingPkg.geometries?.forEach((g) => checkEntity(g.geometryId, g.geometryChecksum, g.lineageId, 'DUPLICATE_GEOMETRY_ID'));

    return Object.freeze(conflicts);
  }

  /**
   * Resolve a specific conflict according to chosen strategy.
   */
  public static resolveConflict(
    conflict: ImportConflict,
    strategy: ConflictResolutionStrategy,
    targetWorkspaceId: string,
    originalLineageId: string
  ): ImportResolution {
    const resolutionId = generateDeterministicResolutionId(conflict.conflictId, strategy);

    let newEntityId: string | undefined;
    let newLineageId: string | undefined;

    if (strategy === 'CREATE_NEW_LINEAGE') {
      newEntityId = generateDeterministicNewEntityId(conflict.entityId, targetWorkspaceId);
      newLineageId = generateDeterministicNewLineageId(originalLineageId, targetWorkspaceId);
    }

    const raw = JSON.stringify([
      resolutionId,
      conflict.conflictId,
      strategy,
      originalLineageId,
      newEntityId ?? null,
      newLineageId ?? null,
    ]);
    const resolutionChecksum = deterministicHash(raw);

    return Object.freeze({
      resolutionId,
      conflictId: conflict.conflictId,
      entityId: conflict.entityId,
      strategy,
      originalLineageId,
      newLineageId,
      newEntityId,
      resolutionChecksum,
    });
  }
}
