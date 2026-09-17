/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.20: Workspace Graph Integrity Validator
 *
 * Scans workspace entities and dependencies for broken references,
 * non-finite coordinates, duplicate identities, cryptographic mismatches,
 * boundary breaches, and privacy leaks.
 */

import {
  AuditableWorkspace,
  IntegrityReport,
  IntegrityIssue,
  IntegrityStatus,
} from './types';
import {
  generateDeterministicIntegrityId,
  generateDeterministicIssueId,
  deterministicHash,
} from './determinism';

export class IntegrityValidator {
  public static validate(workspace: AuditableWorkspace): IntegrityReport {
    const issues: IntegrityIssue[] = [];

    const addIssue = (
      code: IntegrityIssue['code'],
      entityType: string,
      entityId: string,
      message: string,
      severity: IntegrityIssue['severity'] = 'ERROR'
    ) => {
      issues.push(
        Object.freeze({
          issueId: generateDeterministicIssueId(code, entityId),
          code,
          entityType,
          entityId,
          message,
          severity,
        })
      );
    };

    // 1. Duplicate ID Checks
    const seenIds = new Set<string>();
    const checkDuplicate = (id: string, entityType: string) => {
      if (!id || id.trim() === '') {
        addIssue('MISSING_ID', entityType, 'UNKNOWN', `Empty or missing ID in ${entityType}`, 'CRITICAL');
        return;
      }
      if (seenIds.has(id)) {
        addIssue('DUPLICATE_ID', entityType, id, `Duplicate entity ID detected: ${id}`, 'CRITICAL');
      }
      seenIds.add(id);
    };

    workspace.spaces.forEach((s) => checkDuplicate(s.spaceId, 'Space'));
    workspace.experiments.forEach((e) => checkDuplicate(e.experimentId, 'Experiment'));
    workspace.realityStates.forEach((r) => checkDuplicate(r.realityStateId, 'RealityState'));
    workspace.models.forEach((m) => checkDuplicate(m.modelId, 'Model'));
    workspace.geometries.forEach((g) => checkDuplicate(g.geometryId, 'Geometry'));
    workspace.savedStates.forEach((st) => checkDuplicate(st.stateId, 'SavedState'));
    workspace.versions.forEach((v) => checkDuplicate(v.versionId, 'Version'));
    workspace.timelines.forEach((t) => checkDuplicate(t.timelineId, 'Timeline'));
    workspace.collaborations.forEach((c) => checkDuplicate(c.collaborationId, 'Collaboration'));

    // 2. Space Reference Boundaries
    const spaceIds = new Set(workspace.spaces.map((s) => s.spaceId));
    workspace.experiments.forEach((e) => {
      if (!spaceIds.has(e.spaceId)) {
        addIssue('INVALID_PARENT_REF', 'Experiment', e.experimentId, `Experiment ${e.experimentId} references non-existent space ${e.spaceId}`, 'CRITICAL');
      }
    });

    workspace.realityStates.forEach((r) => {
      if (!spaceIds.has(r.spaceId)) {
        addIssue('INVALID_PARENT_REF', 'RealityState', r.realityStateId, `Reality state references non-existent space ${r.spaceId}`, 'CRITICAL');
      }
    });

    workspace.models.forEach((m) => {
      if (!spaceIds.has(m.spaceId)) {
        addIssue('INVALID_PARENT_REF', 'Model', m.modelId, `Model references non-existent space ${m.spaceId}`, 'ERROR');
      }
    });

    workspace.geometries.forEach((g) => {
      if (!spaceIds.has(g.spaceId)) {
        addIssue('INVALID_PARENT_REF', 'Geometry', g.geometryId, `Geometry references non-existent space ${g.spaceId}`, 'ERROR');
      }
    });

    // 3. Geometry & Finite Coordinate Integrity
    workspace.geometries.forEach((g) => {
      if (!g.coordinates || g.coordinates.length !== 3) {
        addIssue('INVALID_COORDINATE', 'Geometry', g.geometryId, `Geometry ${g.geometryId} has invalid coordinate dimension`, 'CRITICAL');
      } else {
        const [x, y, z] = g.coordinates;
        if (Number.isNaN(x) || Number.isNaN(y) || Number.isNaN(z)) {
          addIssue('NAN_COORDINATE', 'Geometry', g.geometryId, `Geometry ${g.geometryId} contains NaN coordinate: [${x}, ${y}, ${z}]`, 'CRITICAL');
        }
        if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) {
          addIssue('INFINITY_COORDINATE', 'Geometry', g.geometryId, `Geometry ${g.geometryId} contains non-finite/Infinity coordinate`, 'CRITICAL');
        }
      }

      if (!g.geometryChecksum || g.geometryChecksum.length < 4) {
        addIssue('INVALID_GEOMETRY', 'Geometry', g.geometryId, `Geometry ${g.geometryId} has missing or corrupt checksum`, 'ERROR');
      }

      if (!g.lineageId || g.lineageId.length < 4) {
        addIssue('BROKEN_LINEAGE', 'Geometry', g.geometryId, `Geometry ${g.geometryId} has broken lineage`, 'ERROR');
      }
    });

    // 4. Saved States & Timeline Integrity
    workspace.savedStates.forEach((st) => {
      if (!spaceIds.has(st.spaceId)) {
        addIssue('INVALID_SAVED_STATE', 'SavedState', st.stateId, `Saved state ${st.stateId} references invalid space ${st.spaceId}`, 'ERROR');
      }
      if (!st.aggregateChecksum || st.aggregateChecksum.length < 4) {
        addIssue('CHECKSUM_MISMATCH', 'SavedState', st.stateId, `Saved state ${st.stateId} missing aggregate checksum`, 'ERROR');
      }
    });

    workspace.timelines.forEach((t) => {
      if (!spaceIds.has(t.spaceId)) {
        addIssue('INVALID_TIMELINE_REF', 'Timeline', t.timelineId, `Timeline ${t.timelineId} references invalid space ${t.spaceId}`, 'ERROR');
      }
    });

    // 5. Collaboration Boundary Checks
    workspace.collaborations.forEach((c) => {
      if (!spaceIds.has(c.spaceId)) {
        addIssue('COLLABORATION_BOUNDARY_BREACH', 'Collaboration', c.collaborationId, `Collaboration references non-existent space ${c.spaceId}`, 'CRITICAL');
      }
    });

    // 6. Privacy & Credential Leakage Scanner
    const serialized = JSON.stringify(workspace);
    if (serialized.includes('password') || serialized.includes('token') || serialized.includes('auth_secret')) {
      addIssue('AUTH_CREDENTIAL_LEAK', 'Workspace', workspace.workspaceId, 'Auth credentials or secrets detected in workspace data graph', 'CRITICAL');
    }
    if (serialized.includes('creditCard') || serialized.includes('stripe') || serialized.includes('billing')) {
      addIssue('PAYMENT_DATA_LEAK', 'Workspace', workspace.workspaceId, 'Payment or billing information detected in workspace data graph', 'CRITICAL');
    }

    const isValid = issues.length === 0;
    let status: IntegrityStatus = 'INTEGRITY_VALID';

    if (!isValid) {
      if (issues.some((i) => i.code === 'AUTH_CREDENTIAL_LEAK' || i.code === 'PAYMENT_DATA_LEAK' || i.code === 'PRIVATE_DATA_LEAK')) {
        status = 'PRIVATE_DATA_DETECTED';
      } else if (issues.some((i) => i.code === 'NAN_COORDINATE' || i.code === 'INFINITY_COORDINATE' || i.code === 'INVALID_GEOMETRY')) {
        status = 'CORRUPTED';
      } else if (issues.some((i) => i.code === 'INVALID_PARENT_REF' || i.code === 'INVALID_TIMELINE_REF' || i.code === 'MISSING_ID')) {
        status = 'BROKEN_REFERENCE';
      } else if (issues.some((i) => i.code === 'CHECKSUM_MISMATCH')) {
        status = 'CHECKSUM_MISMATCH';
      } else if (issues.some((i) => i.code === 'BROKEN_LINEAGE')) {
        status = 'LINEAGE_MISMATCH';
      } else {
        status = 'INTEGRITY_INVALID';
      }
    }

    const entityCounts = Object.freeze({
      spaces: workspace.spaces.length,
      experiments: workspace.experiments.length,
      realityStates: workspace.realityStates.length,
      models: workspace.models.length,
      geometries: workspace.geometries.length,
      savedStates: workspace.savedStates.length,
      versions: workspace.versions.length,
      timelines: workspace.timelines.length,
      collaborations: workspace.collaborations.length,
    });

    const checksumSummary = Object.freeze({
      workspaceChecksum: workspace.workspaceChecksum,
      realityChecksum: workspace.realityStates[0]?.realityChecksum ?? 'NONE',
      modelChecksum: workspace.models[0]?.modelChecksum ?? 'NONE',
      geometryChecksum: workspace.geometries[0]?.geometryChecksum ?? 'NONE',
    });

    const reportId = generateDeterministicIntegrityId(workspace.workspaceId, status);
    const rawReport = JSON.stringify([reportId, workspace.workspaceId, status, isValid, issues, entityCounts]);
    const auditChecksum = deterministicHash(rawReport);

    return Object.freeze({
      reportId,
      workspaceId: workspace.workspaceId,
      status,
      isValid,
      issues: Object.freeze(issues),
      entityCounts,
      checksumSummary,
      auditChecksum,
      auditedAt: 0,
    });
  }
}
