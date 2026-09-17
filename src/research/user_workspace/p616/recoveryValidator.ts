/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.16: Recovery Validation Engine
 *
 * Pre-restoration deep validation enforcing structural, geometric,
 * lineage, certainty, boundary, and permission invariants.
 */

import {
  BackupPackage,
  RecoveryValidationReport,
  RecoveryValidationStatus,
  RecoveryAccessContext,
} from './types';
import { CorruptionDetector } from './corruptionDetector';
import { deterministicHash } from './determinism';

export class RecoveryValidator {
  public static validate(
    pkg: BackupPackage,
    accessContext?: RecoveryAccessContext
  ): RecoveryValidationReport {
    const corruptionReport = CorruptionDetector.detectCorruptions(pkg, accessContext);
    const issues: string[] = corruptionReport.corruptions.map((c) => c.message);

    const isValid = !corruptionReport.isCorrupted;
    let status: RecoveryValidationStatus = 'RECOVERY_VALID';

    if (!isValid) {
      if (corruptionReport.corruptions.some((c) => c.type === 'NAN_COORDINATE' || c.type === 'INFINITY_COORDINATE' || c.type === 'INVALID_GEOMETRY' || c.type === 'INVALID_TOPOLOGY')) {
        status = 'CORRUPTED';
      } else if (corruptionReport.corruptions.some((c) => c.type === 'UNAUTHORIZED_ACCESS')) {
        status = 'RESTORE_BLOCKED';
      } else {
        status = 'RECOVERY_INVALID';
      }
    }

    const raw = JSON.stringify([pkg.backupId, isValid, status, issues]);
    const reportChecksum = deterministicHash(raw);

    return Object.freeze({
      isValid,
      status,
      issues: Object.freeze(issues),
      corruptionReport,
      reportChecksum,
    });
  }
}
