/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.16: Read-Only Recovery Preview Engine
 *
 * Simulates and projects restoration outcomes, comparing active vs recovery point
 * checksums, models, geometries, and detecting collisions without mutating active workspace state.
 */

import {
  RecoveryPoint,
  RecoveryPreview,
  RecoveryAccessContext,
} from './types';
import { RecoveryValidator } from './recoveryValidator';
import { RecoveryConflictEngine } from './recoveryConflict';
import {
  generateDeterministicPreviewId,
  deterministicHash,
} from './determinism';

export class RecoveryPreviewEngine {
  public static generatePreview(
    recoveryPoint: RecoveryPoint,
    activeWorkspaceChecksum: string,
    activeModelChecksum: string,
    activeGeometryChecksum: string,
    accessContext?: RecoveryAccessContext,
    existingEntities: ReadonlyMap<string, { checksum: string; lineageId: string; ownerId: string }> = new Map()
  ): RecoveryPreview {
    const previewId = generateDeterministicPreviewId(
      recoveryPoint.recoveryPointId,
      activeWorkspaceChecksum
    );

    const validationReport = RecoveryValidator.validate(recoveryPoint.package, accessContext);
    const conflicts = RecoveryConflictEngine.detectConflicts(recoveryPoint.package, existingEntities);
    const conflictingIds = new Set(conflicts.map((c) => c.entityId));

    const pkg = recoveryPoint.package;
    const entitiesToRestore = Object.freeze({
      spaces: (pkg.spaces ?? []).filter((s) => !conflictingIds.has(s.spaceId)).length,
      experiments: (pkg.experiments ?? []).filter((e) => !conflictingIds.has(e.experimentId)).length,
      savedStates: (pkg.savedStates ?? []).filter((st) => !conflictingIds.has(st.stateId)).length,
      versions: (pkg.versions ?? []).filter((v) => !conflictingIds.has(v.versionId)).length,
      models: (pkg.models ?? []).filter((m) => !conflictingIds.has(m.modelId)).length,
      geometries: (pkg.geometries ?? []).filter((g) => !conflictingIds.has(g.geometryId)).length,
    });

    const entitiesUnchanged = Object.freeze({
      conflictsCount: conflicts.length,
      skippedCount: conflictingIds.size,
    });

    const modelChecksumMatches = activeModelChecksum === recoveryPoint.modelChecksum;
    const geometryChecksumMatches = activeGeometryChecksum === recoveryPoint.geometryChecksum;

    const raw = JSON.stringify([
      previewId,
      recoveryPoint.recoveryPointId,
      activeWorkspaceChecksum,
      recoveryPoint.packageChecksum,
      entitiesToRestore,
      entitiesUnchanged,
      conflicts.length,
      modelChecksumMatches,
      geometryChecksumMatches,
      validationReport.isValid,
    ]);

    const previewChecksum = deterministicHash(raw);

    return Object.freeze({
      previewId,
      recoveryPointId: recoveryPoint.recoveryPointId,
      activeWorkspaceChecksum,
      recoveryPointChecksum: recoveryPoint.packageChecksum,
      entitiesToRestore,
      entitiesUnchanged,
      conflicts,
      modelChecksumMatches,
      geometryChecksumMatches,
      validationReport,
      previewChecksum,
      isReadOnly: true,
    });
  }
}
