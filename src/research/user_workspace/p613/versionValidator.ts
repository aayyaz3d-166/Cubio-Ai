/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.13: Version Validator Engine
 *
 * Validates version schema, parent reference validity, acyclic lineage, and coordinate finiteness.
 */

import { WorkspaceVersion, VersionValidationReport } from './types';
import { deterministicHash } from './determinism';

export class VersionValidator {
  public static validateVersion(
    version: WorkspaceVersion,
    allVersions: readonly WorkspaceVersion[] = []
  ): VersionValidationReport {
    const issues: string[] = [];

    const schemaVer = String(version.schemaVersion || '');
    if (schemaVer !== '6.13.0' && !schemaVer.startsWith('6.')) {
      issues.push(`Invalid schema version: ${version.schemaVersion}`);
    }

    if (!version.workspaceId || !version.workspaceId.trim()) {
      issues.push('Missing or empty workspaceId.');
    }

    if (version.parentVersionId) {
      if (version.parentVersionId === version.versionId) {
        issues.push(`Self-referencing circular parent: ${version.parentVersionId}`);
      }

      if (allVersions.length > 0) {
        const parent = allVersions.find((v) => v.versionId === version.parentVersionId);
        if (!parent) {
          issues.push(`Parent version ${version.parentVersionId} not found in versions repository.`);
        }
      }
    }

    // Check finite coordinates in objects and observers
    for (const obj of version.statePayload.objects) {
      if (!this.validateFiniteCoordinates(obj.position)) {
        issues.push(`Non-finite coordinates found in object ${obj.id}`);
      }
    }

    for (const obs of version.statePayload.observers) {
      if (!this.validateFiniteCoordinates(obs.position) || !this.validateFiniteCoordinates(obs.target)) {
        issues.push(`Non-finite coordinates found in observer ${obs.observerId}`);
      }
    }

    const isValid = issues.length === 0;
    const status = !isValid
      ? issues.some((i) => i.includes('schema version'))
        ? 'INVALID_SCHEMA_VERSION'
        : issues.some((i) => i.includes('circular') || i.includes('Self-referencing'))
        ? 'CIRCULAR_LINEAGE'
        : issues.some((i) => i.includes('not found'))
        ? 'INVALID_PARENT'
        : issues.some((i) => i.includes('Non-finite'))
        ? 'NON_FINITE_COORDINATES'
        : issues.some((i) => i.includes('workspaceId'))
        ? 'CROSS_WORKSPACE_LEAKAGE'
        : 'CORRUPTED_VERSION_STATE'
      : 'VERSION_VALID';

    const reportChecksum = deterministicHash(
      JSON.stringify([status, isValid, version.stateChecksum, issues.length])
    );

    return Object.freeze({
      isValid,
      status,
      issues: Object.freeze(issues),
      reportChecksum,
    });
  }

  public static validateFiniteCoordinates(coords: readonly number[]): boolean {
    return coords.every((c) => typeof c === 'number' && Number.isFinite(c) && !Number.isNaN(c));
  }
}
