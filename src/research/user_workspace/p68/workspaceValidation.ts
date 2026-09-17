/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.8: Workspace Validation Engine
 *
 * Validates integrity, schema, finiteness, absence of duplicate IDs, and cross-space boundaries.
 */

import { PersonalWorkspaceState, WorkspaceValidationReport, PersonalSpace } from './types';
import { deterministicHash } from './determinism';

export class WorkspaceValidationEngine {
  public static validateSpace(space: PersonalSpace): WorkspaceValidationReport {
    const issues: string[] = [];

    if (!space.spaceId || !space.spaceId.startsWith('SPACE_P68_')) {
      issues.push(`Invalid spaceId format: ${space.spaceId}`);
    }

    if (!space.metadata || !space.metadata.ownerUserId) {
      issues.push('Missing or invalid space ownership.');
    }

    if (space.schemaVersion !== '6.8.0') {
      issues.push(`Invalid schema version: ${space.schemaVersion}`);
    }

    // Coordinates finiteness check in Reality
    for (const obj of space.reality.objects || []) {
      for (const coord of obj.position) {
        if (!Number.isFinite(coord)) {
          issues.push(`Non-finite coordinate in object ${obj.id}: ${coord}`);
        }
      }
    }

    // Observer positions finiteness check
    for (const obs of space.observers || []) {
      for (const coord of obs.position) {
        if (!Number.isFinite(coord)) {
          issues.push(`Non-finite coordinate in observer ${obs.observerId}: ${coord}`);
        }
      }
    }

    // Camera position finiteness check
    for (const coord of space.view.cameraPosition || []) {
      if (!Number.isFinite(coord)) {
        issues.push(`Non-finite coordinate in camera position: ${coord}`);
      }
    }

    const isValid = issues.length === 0;
    const status = !isValid
      ? issues.some((m) => m.includes('Non-finite'))
        ? 'NON_FINITE_COORDINATES'
        : issues.some((m) => m.includes('spaceId'))
        ? 'INVALID_SPACE_ID'
        : issues.some((m) => m.includes('ownership'))
        ? 'INVALID_OWNERSHIP'
        : issues.some((m) => m.includes('schema version'))
        ? 'INVALID_SCHEMA_VERSION'
        : 'CORRUPT_SAVED_STATE'
      : 'WORKSPACE_VALID';

    const reportChecksum = deterministicHash(
      JSON.stringify([status, isValid, space.spaceChecksum, issues.length])
    );

    return Object.freeze({
      isValid,
      status,
      issues: Object.freeze(issues),
      reportChecksum,
    });
  }

  public static validateWorkspaceState(state: PersonalWorkspaceState): WorkspaceValidationReport {
    const issues: string[] = [];
    const spaceIds = new Set<string>();

    for (const space of state.spaces) {
      if (spaceIds.has(space.spaceId)) {
        issues.push(`Duplicate space ID: ${space.spaceId}`);
      }
      spaceIds.add(space.spaceId);

      const spaceReport = this.validateSpace(space);
      if (!spaceReport.isValid) {
        issues.push(...spaceReport.issues);
      }
    }

    // Cross-Space reference check in saved states
    for (const st of state.savedStates) {
      if (!spaceIds.has(st.spaceId)) {
        issues.push(`Saved state ${st.stateId} references non-existent space ${st.spaceId}`);
      }
    }

    // Cross-Space reference check in experiments
    for (const exp of state.experiments) {
      if (!spaceIds.has(exp.spaceId)) {
        issues.push(`Experiment ${exp.experimentId} references non-existent space ${exp.spaceId}`);
      }
    }

    const isValid = issues.length === 0;
    const status = !isValid
      ? issues.some((m) => m.includes('Duplicate'))
        ? 'DUPLICATE_SPACE_ID'
        : issues.some((m) => m.includes('Non-finite'))
        ? 'NON_FINITE_COORDINATES'
        : issues.some((m) => m.includes('references non-existent'))
        ? 'CROSS_SPACE_CONTAMINATION'
        : 'CORRUPT_SAVED_STATE'
      : 'WORKSPACE_VALID';

    const reportChecksum = deterministicHash(
      JSON.stringify([status, isValid, state.workspaceChecksum, issues.length])
    );

    return Object.freeze({
      isValid,
      status,
      issues: Object.freeze(issues),
      reportChecksum,
    });
  }
}
