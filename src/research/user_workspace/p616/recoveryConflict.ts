/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.16: Recovery Conflict Detection & Resolution Engine
 *
 * Detects entity collisions between recovery point and active workspace state.
 * Resolves collisions explicitly via REJECT, SKIP, or RESTORE_AS_NEW_LINEAGE.
 */

import {
  BackupPackage,
  RecoveryConflict,
  RecoveryConflictType,
  RecoveryConflictResolution,
} from './types';
import {
  generateDeterministicConflictId,
  generateDeterministicNewLineageId,
  generateDeterministicNewEntityId,
} from './determinism';

export class RecoveryConflictEngine {
  public static detectConflicts(
    pkg: BackupPackage,
    existingEntities: ReadonlyMap<string, { checksum: string; lineageId: string; ownerId: string }>
  ): readonly RecoveryConflict[] {
    const conflicts: RecoveryConflict[] = [];

    const check = (entityId: string, incomingChecksum: string, incomingLineage: string, defaultType: RecoveryConflictType) => {
      if (existingEntities.has(entityId)) {
        const existing = existingEntities.get(entityId)!;
        let conflictType: RecoveryConflictType = defaultType;

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
            description: `Entity ${entityId} collides with existing workspace state (${conflictType})`,
          })
        );
      }
    };

    pkg.spaces?.forEach((s) => check(s.spaceId, s.checksum, s.lineageId, 'SPACE_CONFLICT'));
    pkg.experiments?.forEach((e) => check(e.experimentId, e.checksum, e.lineageId, 'EXPERIMENT_CONFLICT'));
    pkg.savedStates?.forEach((st) => check(st.stateId, st.checksum, st.lineageId, 'SAVED_STATE_CONFLICT'));
    pkg.versions?.forEach((v) => check(v.versionId, v.checksum, v.lineageId, 'VERSION_CONFLICT'));
    pkg.models?.forEach((m) => check(m.modelId, m.modelChecksum, 'LIN_MODEL', 'MODEL_CONFLICT'));
    pkg.geometries?.forEach((g) => check(g.geometryId, g.geometryChecksum, g.lineageId, 'GEOMETRY_CONFLICT'));

    return Object.freeze(conflicts);
  }

  public static resolveConflict(
    conflict: RecoveryConflict,
    strategy: RecoveryConflictResolution,
    recoveryPointId: string,
    originalLineageId: string
  ): {
    strategy: RecoveryConflictResolution;
    resolvedEntityId?: string;
    resolvedLineageId?: string;
  } {
    let resolvedEntityId: string | undefined;
    let resolvedLineageId: string | undefined;

    if (strategy === 'RESTORE_AS_NEW_LINEAGE') {
      resolvedEntityId = generateDeterministicNewEntityId(conflict.entityId, recoveryPointId);
      resolvedLineageId = generateDeterministicNewLineageId(originalLineageId, recoveryPointId);
    }

    return Object.freeze({
      strategy,
      resolvedEntityId,
      resolvedLineageId,
    });
  }
}
