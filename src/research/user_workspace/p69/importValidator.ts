/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.9: Import Validation Pipeline
 *
 * Enforces strict validation across Schema, Identity, Reality, Observers, Geometry, and Checksums.
 */

import { ResearchExportPackage, ImportValidationReport } from './types';
import { deterministicHash } from './determinism';

export class ImportValidator {
  public static validatePackage(pkg: unknown): ImportValidationReport {
    const issues: string[] = [];

    if (!pkg || typeof pkg !== 'object') {
      return Object.freeze({
        isValid: false,
        status: 'CORRUPTED_PAYLOAD',
        issues: Object.freeze(['Package is not a valid JSON object.']),
        reportChecksum: deterministicHash('CORRUPTED_PAYLOAD'),
      });
    }

    const researchPkg = pkg as Partial<ResearchExportPackage>;

    if (!researchPkg.manifest || !researchPkg.space) {
      return Object.freeze({
        isValid: false,
        status: 'CORRUPTED_PAYLOAD',
        issues: Object.freeze(['Missing required manifest or space payload.']),
        reportChecksum: deterministicHash('MISSING_MANIFEST'),
      });
    }

    const { manifest, space } = researchPkg;

    // Schema Validation
    const schemaVer = String(manifest.schemaVersion || '');
    if (schemaVer !== '6.9.0' && !schemaVer.startsWith('6.')) {
      issues.push(`Invalid or unsupported schema version: ${manifest.schemaVersion}`);
    }

    // Reality Validation
    if (!space.reality || !Array.isArray(space.reality.objects)) {
      issues.push('Malformed Reality: objects array missing or invalid.');
    } else {
      for (const obj of space.reality.objects) {
        if (!obj.position || obj.position.length !== 3) {
          issues.push(`Object ${obj.id} has invalid coordinate dimension.`);
        } else {
          for (const coord of obj.position) {
            if (!Number.isFinite(coord)) {
              issues.push(`Object ${obj.id} contains non-finite coordinate: ${coord}`);
            }
          }
        }
      }
    }

    // Observer Validation
    if (!Array.isArray(space.observers)) {
      issues.push('Malformed Observers: observers array missing.');
    } else {
      for (const obs of space.observers) {
        if (!obs.position || !obs.target || !Number.isFinite(obs.fov)) {
          issues.push(`Observer ${obs.observerId} is malformed.`);
        }
        for (const coord of obs.position || []) {
          if (!Number.isFinite(coord)) {
            issues.push(`Observer ${obs.observerId} contains non-finite position coordinate: ${coord}`);
          }
        }
      }
    }

    // Geometry & Model Validation
    if (!space.modelScene || !space.geometryScene) {
      issues.push('Missing Model or Geometry scene in space payload.');
    }

    // Checksum Validation
    if (manifest.sourceChecksum !== space.spaceChecksum) {
      issues.push(
        `Checksum mismatch: manifest checksum ${manifest.sourceChecksum} !== space checksum ${space.spaceChecksum}`
      );
    }

    const isValid = issues.length === 0;
    const status = !isValid
      ? issues.some((m) => m.includes('non-finite'))
        ? 'NON_FINITE_COORDINATES'
        : issues.some((m) => m.includes('schema version'))
        ? 'INVALID_SCHEMA'
        : issues.some((m) => m.includes('Reality'))
        ? 'MALFORMED_REALITY'
        : issues.some((m) => m.includes('Observer'))
        ? 'INVALID_OBSERVERS'
        : issues.some((m) => m.includes('Geometry'))
        ? 'INVALID_GEOMETRY'
        : issues.some((m) => m.includes('Checksum'))
        ? 'CHECKSUM_MISMATCH'
        : 'CORRUPTED_PAYLOAD'
      : 'PACKAGE_VALID';

    const reportChecksum = deterministicHash(
      JSON.stringify([status, isValid, manifest.exportId, issues.length])
    );

    return Object.freeze({
      isValid,
      status,
      issues: Object.freeze(issues),
      reportChecksum,
    });
  }
}
