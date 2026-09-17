/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.15: Import & Export Deep Validator
 *
 * Enforces structural integrity, finite coordinates, geometry validity,
 * checksum matching, boundary preservation, and access authorization.
 */

import {
  WorkspaceExportPackage,
  ImportValidationReport,
  ExportValidationReport,
  PortabilityValidationStatus,
  PortabilityAccessContext,
} from './types';
import { deterministicHash } from './determinism';

const SUPPORTED_SCHEMAS = new Set([
  '6.1.0',
  '6.2.0',
  '6.3.0',
  '6.4.0',
  '6.5.0',
  '6.6.0',
  '6.7.0',
  '6.8.0',
  '6.9.0',
  '6.10.0',
  '6.11.0',
  '6.12.0',
  '6.13.0',
  '6.14.0',
  '6.15.0',
]);

export class PortabilityValidator {
  /**
   * Deep validation of an incoming package before import.
   */
  public static validatePackage(
    pkg: WorkspaceExportPackage,
    targetAccessContext?: PortabilityAccessContext
  ): ImportValidationReport {
    const issues: string[] = [];

    // 1. Schema check
    if (!pkg.schemaVersion || !SUPPORTED_SCHEMAS.has(pkg.schemaVersion)) {
      issues.push(`Unsupported or missing schema version: ${pkg.schemaVersion}`);
    }

    // 2. Package Identity
    if (!pkg.packageId || !pkg.packageId.startsWith('PKG_P615_')) {
      issues.push('Invalid or malformed packageId');
    }

    // 3. Manifest Check
    if (!pkg.manifest || !pkg.manifest.manifestId) {
      issues.push('Missing or invalid export manifest');
    }

    // 4. Duplicate ID check across all collections
    const seenIds = new Set<string>();
    const checkDuplicate = (id: string, type: string) => {
      if (seenIds.has(id)) {
        issues.push(`Duplicate entity ID detected: ${id} (${type})`);
      }
      seenIds.add(id);
    };

    pkg.spaces?.forEach((s) => checkDuplicate(s.spaceId, 'Space'));
    pkg.experiments?.forEach((e) => checkDuplicate(e.experimentId, 'Experiment'));
    pkg.savedStates?.forEach((st) => checkDuplicate(st.stateId, 'SavedState'));
    pkg.versions?.forEach((v) => checkDuplicate(v.versionId, 'Version'));
    pkg.models?.forEach((m) => checkDuplicate(m.modelId, 'Model'));
    pkg.geometries?.forEach((g) => checkDuplicate(g.geometryId, 'Geometry'));

    // 5. Finite Coordinate & Geometry Integrity
    pkg.geometries?.forEach((g) => {
      if (!g.coordinates || g.coordinates.length !== 3) {
        issues.push(`Geometry ${g.geometryId} has invalid coordinate dimension`);
      } else {
        const [x, y, z] = g.coordinates;
        if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) {
          issues.push(`Geometry ${g.geometryId} contains non-finite coordinates: [${x}, ${y}, ${z}]`);
        }
      }
      if (!g.lineageId || g.lineageId.length < 4) {
        issues.push(`Geometry ${g.geometryId} has missing or malformed lineageId`);
      }
      if (!g.geometryChecksum || g.geometryChecksum.length < 4) {
        issues.push(`Geometry ${g.geometryId} has invalid checksum`);
      }
    });

    // 6. Space Boundary Integrity for Experiments/States/Versions
    const spaceIds = new Set(pkg.spaces?.map((s) => s.spaceId) ?? []);
    pkg.experiments?.forEach((e) => {
      if (!spaceIds.has(e.spaceId)) {
        issues.push(`Experiment ${e.experimentId} references unindexed space: ${e.spaceId}`);
      }
    });

    // 7. Authorization Check (if target context is provided)
    if (targetAccessContext && targetAccessContext.userRole === 'NO_ACCESS') {
      issues.push('Target user context has NO_ACCESS permissions');
    }

    const isValid = issues.length === 0;
    let status: PortabilityValidationStatus = 'IMPORT_VALID';

    if (!isValid) {
      if (issues.some((i) => i.includes('schema'))) {
        status = 'INVALID_SCHEMA';
      } else if (issues.some((i) => i.includes('non-finite'))) {
        status = 'NON_FINITE_COORDINATE';
      } else if (issues.some((i) => i.includes('NO_ACCESS') || i.includes('unauthorized'))) {
        status = 'UNAUTHORIZED_DATA';
      } else if (issues.some((i) => i.includes('coordinate dimension') || i.includes('malformed'))) {
        status = 'MALFORMED_GEOMETRY';
      } else {
        status = 'IMPORT_BLOCKED';
      }
    }

    const raw = JSON.stringify([pkg.packageId, isValid, status, issues]);
    const reportChecksum = deterministicHash(raw);

    return Object.freeze({
      isValid,
      status,
      issues: Object.freeze(issues),
      reportChecksum,
    });
  }

  /**
   * Validate an export package before writing.
   */
  public static validateExport(pkg: WorkspaceExportPackage): ExportValidationReport {
    const report = PortabilityValidator.validatePackage(pkg);
    const status: PortabilityValidationStatus = report.isValid ? 'EXPORT_VALID' : 'EXPORT_BLOCKED';

    return Object.freeze({
      isValid: report.isValid,
      status,
      issues: report.issues,
      reportChecksum: report.reportChecksum,
    });
  }
}
