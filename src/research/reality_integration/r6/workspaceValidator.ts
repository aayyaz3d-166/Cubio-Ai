/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R6: Workspace Validator
 *
 * Validates Workspace state integrity, references, checksums, and coordinates.
 */

import {
  WorkspaceState,
  WorkspaceValidationReport,
  WorkspaceValidationStatus,
} from './types';
import { deterministicHash } from './determinism';

export class WorkspaceValidator {
  public static validateWorkspace(ws: WorkspaceState | null | undefined): WorkspaceValidationReport {
    if (!ws) {
      return Object.freeze({
        status: 'MISSING_REALITY_REFERENCE',
        isValid: false,
        issues: Object.freeze(['WorkspaceState is null or undefined']),
        workspaceId: 'UNKNOWN',
        reportChecksum: deterministicHash('NULL_WS'),
      });
    }

    const issues: string[] = [];

    // Reality binding validation
    if (!ws.realityBinding || !ws.realityBinding.realityId) {
      return Object.freeze({
        status: 'MISSING_REALITY_REFERENCE',
        isValid: false,
        issues: Object.freeze(['Missing Reality reference in workspace']),
        workspaceId: ws.workspaceId,
        reportChecksum: deterministicHash('MISSING_REALITY_REFERENCE'),
      });
    }

    if (!ws.realityBinding.realityStateId) {
      return Object.freeze({
        status: 'MISSING_STATE_REFERENCE',
        isValid: false,
        issues: Object.freeze(['Missing Reality State reference in workspace']),
        workspaceId: ws.workspaceId,
        reportChecksum: deterministicHash('MISSING_STATE_REFERENCE'),
      });
    }

    // Object validation
    const objIds = new Set<string>();
    for (const obj of ws.objects) {
      if (objIds.has(obj.workspaceObjectId)) {
        return Object.freeze({
          status: 'DUPLICATE_WORKSPACE_ID',
          isValid: false,
          issues: Object.freeze([`Duplicate workspace object ID: ${obj.workspaceObjectId}`]),
          workspaceId: ws.workspaceId,
          reportChecksum: deterministicHash('DUPLICATE_WORKSPACE_ID'),
        });
      }
      objIds.add(obj.workspaceObjectId);

      if (obj.coordinates) {
        const [x, y, z] = obj.coordinates;
        if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z) || Number.isNaN(x) || Number.isNaN(y) || Number.isNaN(z)) {
          return Object.freeze({
            status: 'NON_FINITE_COORDINATES',
            isValid: false,
            issues: Object.freeze([`Non-finite coordinates in object ${obj.workspaceObjectId}`]),
            workspaceId: ws.workspaceId,
            reportChecksum: deterministicHash('NON_FINITE_COORDINATES'),
          });
        }
      }

      if (obj.dimensions) {
        const [w, h, d] = obj.dimensions;
        if (w <= 0 || h <= 0 || d <= 0 || !Number.isFinite(w) || !Number.isFinite(h) || !Number.isFinite(d)) {
          return Object.freeze({
            status: 'INVALID_DIMENSIONS',
            isValid: false,
            issues: Object.freeze([`Invalid dimensions in object ${obj.workspaceObjectId}`]),
            workspaceId: ws.workspaceId,
            reportChecksum: deterministicHash('INVALID_DIMENSIONS'),
          });
        }
      }
    }

    // Relationship validation
    for (const rel of ws.relationships) {
      if (!objIds.has(rel.sourceWorkspaceObjectId)) {
        return Object.freeze({
          status: 'MISSING_OBJECT_REFERENCE',
          isValid: false,
          issues: Object.freeze([`Relationship source object not in workspace: ${rel.sourceWorkspaceObjectId}`]),
          workspaceId: ws.workspaceId,
          reportChecksum: deterministicHash('MISSING_OBJECT_REFERENCE'),
        });
      }
      if (!objIds.has(rel.targetWorkspaceObjectId)) {
        return Object.freeze({
          status: 'MISSING_OBJECT_REFERENCE',
          isValid: false,
          issues: Object.freeze([`Relationship target object not in workspace: ${rel.targetWorkspaceObjectId}`]),
          workspaceId: ws.workspaceId,
          reportChecksum: deterministicHash('MISSING_OBJECT_REFERENCE'),
        });
      }
    }

    // Spatial validation
    for (const sp of ws.spatialRelations) {
      if (!objIds.has(sp.sourceWorkspaceObjectId) || !objIds.has(sp.targetWorkspaceObjectId)) {
        return Object.freeze({
          status: 'BROKEN_SPATIAL_REFERENCE',
          isValid: false,
          issues: Object.freeze([`Broken spatial reference: ${sp.workspaceSpatialId}`]),
          workspaceId: ws.workspaceId,
          reportChecksum: deterministicHash('BROKEN_SPATIAL_REFERENCE'),
        });
      }
    }

    const isValid = issues.length === 0;
    const status: WorkspaceValidationStatus = isValid ? 'WORKSPACE_VALID' : 'INVALID_CHECKSUM';
    const reportChecksum = deterministicHash(issues.join(';') + `_${status}`);

    return Object.freeze({
      status,
      isValid,
      issues: Object.freeze(issues),
      workspaceId: ws.workspaceId,
      reportChecksum,
    });
  }
}
