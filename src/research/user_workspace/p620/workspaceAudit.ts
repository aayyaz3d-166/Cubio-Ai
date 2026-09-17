/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.20: Workspace End-to-End Dependency Graph Auditor
 *
 * Traverses and audits complete workspace graph:
 * User -> Workspace -> Space -> Experiment -> State -> Model -> Geometry -> Timeline -> Collaboration
 */

import {
  AuditableWorkspace,
  WorkspaceAudit,
} from './types';
import { IntegrityValidator } from './integrityValidator';
import {
  generateDeterministicAuditId,
  deterministicHash,
} from './determinism';

export class WorkspaceAuditEngine {
  public static auditWorkspace(workspace: AuditableWorkspace): WorkspaceAudit {
    const integrityReport = IntegrityValidator.validate(workspace);

    const isUserLinked = Boolean(workspace.ownerId && workspace.ownerId.length > 0);
    const areSpacesLinked = workspace.spaces.length > 0 && workspace.spaces.every((s) => s.workspaceId === workspace.workspaceId);
    const spaceIds = new Set(workspace.spaces.map((s) => s.spaceId));

    const areExperimentsLinked = workspace.experiments.every((e) => spaceIds.has(e.spaceId));
    const areStatesLinked = workspace.savedStates.every((st) => spaceIds.has(st.spaceId));
    const areModelsLinked = workspace.models.every((m) => spaceIds.has(m.spaceId));
    const areGeometriesLinked = workspace.geometries.every((g) => spaceIds.has(g.spaceId));
    const areTimelinesLinked = workspace.timelines.every((t) => spaceIds.has(t.spaceId));
    const areCollaborationsLinked = workspace.collaborations.every((c) => spaceIds.has(c.spaceId));

    const totalEntities =
      workspace.spaces.length +
      workspace.experiments.length +
      workspace.savedStates.length +
      workspace.models.length +
      workspace.geometries.length;

    const auditId = generateDeterministicAuditId(workspace.workspaceId, totalEntities);

    const graphValidation = Object.freeze({
      isUserLinked,
      areSpacesLinked,
      areExperimentsLinked,
      areStatesLinked,
      areModelsLinked,
      areGeometriesLinked,
      areTimelinesLinked,
      areCollaborationsLinked,
    });

    const rawAudit = JSON.stringify([
      '6.20.0',
      auditId,
      workspace.workspaceId,
      graphValidation,
      integrityReport.auditChecksum,
    ]);
    const auditChecksum = deterministicHash(rawAudit);

    return Object.freeze({
      auditId,
      workspaceId: workspace.workspaceId,
      schemaVersion: '6.20.0',
      graphValidation,
      integrityReport,
      auditChecksum,
    });
  }
}
