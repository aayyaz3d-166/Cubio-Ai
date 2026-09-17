/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.15: Read-Only Import Preview Engine
 *
 * Previews incoming workspace packages, detecting conflicts and skipped entities
 * without committing or mutating existing workspace state.
 */

import {
  WorkspaceExportPackage,
  ImportPreview,
  PortabilityAccessContext,
  ImportConflict,
} from './types';
import { PortabilityValidator } from './importValidator';
import { ConflictResolver } from './conflictResolver';
import {
  generateDeterministicPreviewId,
  deterministicHash,
} from './determinism';

export class ImportPreviewEngine {
  public static generatePreview(
    pkg: WorkspaceExportPackage,
    targetContext: PortabilityAccessContext,
    existingEntities: ReadonlyMap<string, { checksum: string; lineageId: string; ownerId: string }> = new Map()
  ): ImportPreview {
    const previewId = generateDeterministicPreviewId(pkg.packageId, targetContext.workspaceId);
    const validationReport = PortabilityValidator.validatePackage(pkg, targetContext);

    // Detect any conflicts against existing entities
    const conflicts = ConflictResolver.detectConflicts(pkg, existingEntities);

    const conflictingEntityIds = new Set(conflicts.map((c) => c.entityId));

    const spacesToImport = (pkg.spaces ?? []).filter((s) => !conflictingEntityIds.has(s.spaceId));
    const experimentsToImport = (pkg.experiments ?? []).filter((e) => !conflictingEntityIds.has(e.experimentId));
    const statesToImport = (pkg.savedStates ?? []).filter((st) => !conflictingEntityIds.has(st.stateId));
    const versionsToImport = (pkg.versions ?? []).filter((v) => !conflictingEntityIds.has(v.versionId));
    const modelsToImport = (pkg.models ?? []).filter((m) => !conflictingEntityIds.has(m.modelId));
    const geometriesToImport = (pkg.geometries ?? []).filter((g) => !conflictingEntityIds.has(g.geometryId));

    const entitiesToSkip = [...conflictingEntityIds];

    const raw = JSON.stringify([
      previewId,
      pkg.packageId,
      pkg.workspaceId,
      targetContext.workspaceId,
      spacesToImport.length,
      experimentsToImport.length,
      statesToImport.length,
      versionsToImport.length,
      conflicts.length,
      validationReport.isValid,
    ]);
    const previewChecksum = deterministicHash(raw);

    return Object.freeze({
      previewId,
      packageId: pkg.packageId,
      sourceWorkspaceId: pkg.workspaceId,
      targetWorkspaceId: targetContext.workspaceId,
      spacesToImport: Object.freeze(spacesToImport),
      experimentsToImport: Object.freeze(experimentsToImport),
      statesToImport: Object.freeze(statesToImport),
      versionsToImport: Object.freeze(versionsToImport),
      modelsToImport: Object.freeze(modelsToImport),
      geometriesToImport: Object.freeze(geometriesToImport),
      entitiesToSkip: Object.freeze(entitiesToSkip),
      conflicts: Object.freeze(conflicts),
      validationReport,
      previewChecksum,
      isReadOnly: true,
    });
  }
}
