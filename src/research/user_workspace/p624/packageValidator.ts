/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.24: Workspace Package Validator
 *
 * Validates package schemas, cryptographic checksums, coordinate validity,
 * and security boundaries before any import processing.
 */

import {
  WorkspacePackage,
  PackageValidationReport,
  PackageValidationStatus,
  PortabilityPermissionContext,
} from './types';
import {
  deterministicHash,
  generateDeterministicPackageChecksum,
} from './determinism';

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
  '6.16.0',
  '6.17.0',
  '6.18.0',
  '6.19.0',
  '6.20.0',
  '6.21.0',
  '6.22.0',
  '6.23.0',
  '6.24.0',
]);

export class PackageValidator {
  public static validatePackage(
    pkg: WorkspacePackage,
    context?: PortabilityPermissionContext
  ): PackageValidationReport {
    const issues: string[] = [];

    // 1. Schema Check
    if (!pkg.schemaVersion || !SUPPORTED_SCHEMAS.has(pkg.schemaVersion)) {
      issues.push(`Incompatible schema version: ${pkg.schemaVersion}`);
    }

    // 2. Manifest Check
    if (!pkg.manifest || !pkg.manifest.manifestId || !pkg.manifest.manifestChecksum) {
      issues.push('Missing or malformed package manifest');
    }

    // 3. Package Checksum Check
    if (pkg.manifest && pkg.entities) {
      const expectedChecksum = generateDeterministicPackageChecksum(
        pkg.manifest.manifestChecksum,
        pkg.entities.map((e) => e.checksum)
      );
      if (pkg.packageChecksum !== expectedChecksum) {
        issues.push(`Package checksum mismatch: expected ${expectedChecksum}, got ${pkg.packageChecksum}`);
      }
    }

    // 4. Duplicate Entity Check
    const seenIds = new Set<string>();
    if (pkg.entities) {
      pkg.entities.forEach((e) => {
        if (!e.entityId) {
          issues.push('Entity missing mandatory entityId');
        } else if (seenIds.has(e.entityId)) {
          issues.push(`Duplicate entityId detected: ${e.entityId}`);
        }
        seenIds.add(e.entityId);

        // Lineage & Checksum
        if (!e.lineageId || e.lineageId.length < 4) {
          issues.push(`Entity ${e.entityId} has broken lineageId`);
        }
        if (!e.checksum || e.checksum.length < 4) {
          issues.push(`Entity ${e.entityId} has invalid checksum`);
        }

        // Finite Coordinates Check
        if (e.coordinates) {
          const [x, y, z] = e.coordinates;
          if (
            Number.isNaN(x) ||
            Number.isNaN(y) ||
            Number.isNaN(z) ||
            !Number.isFinite(x) ||
            !Number.isFinite(y) ||
            !Number.isFinite(z)
          ) {
            issues.push(`Entity ${e.entityId} contains non-finite coordinates`);
          }
        }
      });
    }

    // 5. Dependency Reference Integrity Check
    if (pkg.entities) {
      pkg.entities.forEach((e) => {
        if (e.dependencies) {
          e.dependencies.forEach((dep) => {
            if (dep.isRequired && !seenIds.has(dep.dependencyId)) {
              issues.push(`Entity ${e.entityId} has missing required dependency: ${dep.dependencyId}`);
            }
          });
        }
      });
    }

    // 6. Privacy and Security Check
    const pkgJson = JSON.stringify(pkg);
    if (
      pkgJson.includes('password') ||
      pkgJson.includes('authToken') ||
      pkgJson.includes('creditCard') ||
      pkgJson.includes('billingSecret')
    ) {
      issues.push('Forbidden credential or payment data detected in package payload');
    }

    // 7. Authorization Check
    if (context) {
      if (context.isRevoked || context.userRole === 'NO_ACCESS') {
        issues.push(`User ${context.userId} is not authorized for package operations`);
      }
    }

    const isValid = issues.length === 0;
    let status: PackageValidationStatus = 'PACKAGE_VALID';

    if (!isValid) {
      if (issues.some((i) => i.includes('Incompatible schema'))) {
        status = 'PACKAGE_INCOMPATIBLE';
      } else if (issues.some((i) => i.includes('not authorized') || i.includes('credential'))) {
        status = 'PACKAGE_UNAUTHORIZED';
      } else if (issues.some((i) => i.includes('checksum mismatch') || i.includes('malformed'))) {
        status = 'PACKAGE_CORRUPTED';
      } else {
        status = 'PACKAGE_INVALID';
      }
    }

    const raw = JSON.stringify([isValid, status, issues, pkg.packageId]);
    const reportChecksum = deterministicHash(raw);

    return Object.freeze({
      isValid,
      status,
      issues: Object.freeze(issues),
      reportChecksum,
    });
  }
}
