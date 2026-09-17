/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.25-I: Workspace Integration Validator
 *
 * Validates workspace states, space boundaries, ownership permissions,
 * coordinate integrity, and absence of cross-user leakage.
 */

import {
  LiveWorkspaceState,
  LiveSpaceState,
  WorkspaceUserContext,
  WorkspaceIntegrationValidationReport,
} from './types';
import { deterministicHash } from './workspaceEvents';

export class WorkspaceIntegrationValidator {
  public static validate(
    workspace: LiveWorkspaceState,
    context: WorkspaceUserContext
  ): WorkspaceIntegrationValidationReport {
    const issues: string[] = [];

    // 1. Authentication & Role Check
    if (!context.isAuthenticated || context.userRole === 'NO_ACCESS') {
      issues.push(`User ${context.userId} is not authorized for workspace access`);
    }

    // 2. Ownership & User Boundary Check
    workspace.spaces.forEach((space) => {
      if (context.userRole === 'OWNER' && space.ownerId !== context.userId) {
        issues.push(`Space ${space.spaceId} owned by ${space.ownerId} violates ownership boundary for user ${context.userId}`);
      }

      // Finite coordinates check
      const [x, y, z] = space.currentCoordinates;
      if (
        Number.isNaN(x) ||
        Number.isNaN(y) ||
        Number.isNaN(z) ||
        !Number.isFinite(x) ||
        !Number.isFinite(y) ||
        !Number.isFinite(z)
      ) {
        issues.push(`Space ${space.spaceId} contains non-finite coordinates`);
      }

      // Checksum & Lineage Check
      if (!space.checksum || space.checksum.length < 4) {
        issues.push(`Space ${space.spaceId} has invalid checksum`);
      }
      if (!space.lineageId || space.lineageId.length < 4) {
        issues.push(`Space ${space.spaceId} has broken lineageId`);
      }
    });

    // 3. Active Space Check
    if (workspace.activeSpaceId) {
      const activeExists = workspace.spaces.some((s) => s.spaceId === workspace.activeSpaceId && !s.isDeleted);
      if (!activeExists) {
        issues.push(`Active space ${workspace.activeSpaceId} not found or is deleted`);
      }
    }

    // 4. Duplicate Spaces Check
    const seenSpaceIds = new Set<string>();
    workspace.spaces.forEach((s) => {
      if (seenSpaceIds.has(s.spaceId)) {
        issues.push(`Duplicate space ID detected: ${s.spaceId}`);
      }
      seenSpaceIds.add(s.spaceId);
    });

    const isValid = issues.length === 0;
    const raw = JSON.stringify([isValid, issues, workspace.workspaceId, context.userId]);
    const reportChecksum = deterministicHash(raw);

    return Object.freeze({
      isValid,
      issues: Object.freeze(issues),
      reportChecksum,
    });
  }
}
