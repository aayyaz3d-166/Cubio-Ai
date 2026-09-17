/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.16: Immutable Recovery Point Engine
 *
 * Captures, freezes, and preserves immutable recovery point milestones.
 * Guarantees that future workspace operations or mutations cannot alter existing recovery points.
 */

import {
  RecoveryPoint,
  BackupPackage,
  RecoveryValidationStatus,
} from './types';
import {
  generateDeterministicRecoveryPointId,
  deterministicHash,
} from './determinism';

export class RecoveryPointEngine {
  public static createRecoveryPoint(
    pkg: BackupPackage,
    validationStatus: RecoveryValidationStatus = 'RECOVERY_VALID'
  ): RecoveryPoint {
    const recoveryPointId = generateDeterministicRecoveryPointId(
      pkg.workspaceId,
      pkg.manifest.sourceChecksum,
      pkg.scope
    );

    const raw = JSON.stringify([
      '6.16.0',
      recoveryPointId,
      pkg.workspaceId,
      pkg.scope,
      pkg.packageChecksum,
      pkg.manifest.manifestChecksum,
      pkg.manifest.sourceChecksum,
      pkg.manifest.modelChecksum,
      pkg.manifest.geometryChecksum,
      pkg.manifest.entityCounts,
      validationStatus,
    ]);

    const pointChecksum = deterministicHash(raw);

    return Object.freeze({
      recoveryPointId,
      schemaVersion: '6.16.0',
      scope: pkg.scope,
      sourceWorkspaceId: pkg.workspaceId,
      sourceSpaceIds: pkg.manifest.sourceSpaceIds,
      sourceChecksum: pkg.manifest.sourceChecksum,
      packageChecksum: pkg.packageChecksum,
      manifestChecksum: pkg.manifest.manifestChecksum,
      modelChecksum: pkg.manifest.modelChecksum,
      geometryChecksum: pkg.manifest.geometryChecksum,
      entityCounts: pkg.manifest.entityCounts,
      lineageSummary: pkg.manifest.lineageSummary,
      certaintySummary: pkg.manifest.certaintySummary,
      package: Object.freeze({ ...pkg }),
      validationStatus,
      isFrozen: true,
      createdAt: 0,
      pointChecksum,
    });
  }
}
