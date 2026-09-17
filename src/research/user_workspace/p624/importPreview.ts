/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.24: Import Preview Generator
 *
 * Constructs deeply frozen, read-only import previews before committing changes.
 */

import {
  WorkspacePackage,
  PackageEntity,
  ImportPreview,
  ImportConflict,
} from './types';
import {
  generateDeterministicPreviewId,
  deterministicHash,
} from './determinism';

export class ImportPreviewGenerator {
  public static generatePreview(
    pkg: WorkspacePackage,
    entitiesToImport: readonly PackageEntity[],
    conflicts: readonly ImportConflict[]
  ): ImportPreview {
    const previewId = generateDeterministicPreviewId(pkg.packageId);

    const spacesCount = entitiesToImport.filter((e) => e.entityType === 'SPACE').length;
    const experimentsCount = entitiesToImport.filter((e) => e.entityType === 'EXPERIMENT').length;
    const statesCount = entitiesToImport.filter((e) => e.entityType === 'SAVED_STATE').length;
    const versionsCount = entitiesToImport.filter((e) => e.entityType === 'VERSION').length;
    const modelsCount = entitiesToImport.filter((e) => e.entityType === 'MODEL_OBJECT').length;
    const geometriesCount = entitiesToImport.filter((e) => e.entityType === 'GEOMETRY_OBJECT').length;

    const requiresExplicitResolution = conflicts.some((c) => c.conflictType === 'ID_COLLISION');

    const raw = JSON.stringify([
      previewId,
      pkg.packageId,
      entitiesToImport.map((e) => e.entityId),
      conflicts.map((c) => c.conflictId),
    ]);
    const previewChecksum = deterministicHash(raw);

    return Object.freeze({
      previewId,
      packageId: pkg.packageId,
      isValid: true,
      entitiesToImport: Object.freeze([...entitiesToImport]),
      conflicts: Object.freeze([...conflicts]),
      spacesCount,
      experimentsCount,
      statesCount,
      versionsCount,
      modelsCount,
      geometriesCount,
      requiresExplicitResolution,
      previewChecksum,
    });
  }
}
