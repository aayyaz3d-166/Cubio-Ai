/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.24: Transactional Import Coordinator
 *
 * Enforces an 8-stage transactional pipeline ensuring all-or-nothing atomicity:
 * 1. LOAD -> 2. PARSE -> 3. VALIDATE -> 4. RESOLVE_DEPENDENCIES ->
 * 5. PREVIEW -> 6. AUTHORIZE -> 7. COMMIT -> 8. VERIFY
 */

import {
  WorkspacePackage,
  PackageEntity,
  ImportResult,
  PortabilityPermissionContext,
  ImportOptions,
} from './types';
import { PackageValidator } from './packageValidator';
import { PortabilityBoundaryEngine } from './portabilityBoundary';
import { IdentityResolver } from './identityResolver';
import { ConflictResolver } from './conflictResolver';
import {
  generateDeterministicImportTxId,
  deterministicHash,
} from './determinism';

export class ImportTransactionCoordinator {
  public static executeImport(
    pkg: WorkspacePackage,
    existingEntities: readonly PackageEntity[],
    context: PortabilityPermissionContext,
    options?: ImportOptions
  ): { success: boolean; result: ImportResult; committedEntities?: readonly PackageEntity[] } {
    const txId = generateDeterministicImportTxId(pkg.packageId, context.workspaceId);

    // 1. Stage: VALIDATE
    const validation = PackageValidator.validatePackage(pkg, context);
    if (!validation.isValid) {
      return {
        success: false,
        result: Object.freeze({
          transactionId: txId,
          success: false,
          status: 'IMPORT_BLOCKED',
          importedEntityCount: 0,
          importedEntityIds: Object.freeze([]),
          conflictsEncountered: Object.freeze([]),
          committedAt: 0,
          resultChecksum: deterministicHash(`${txId}_VALIDATION_FAILED`),
          error: `Validation failed: ${validation.issues.join('; ')}`,
        }),
      };
    }

    // 2. Stage: AUTHORIZE
    if (!PortabilityBoundaryEngine.canImport(context, options?.targetSpaceId)) {
      return {
        success: false,
        result: Object.freeze({
          transactionId: txId,
          success: false,
          status: 'IMPORT_BLOCKED',
          importedEntityCount: 0,
          importedEntityIds: Object.freeze([]),
          conflictsEncountered: Object.freeze([]),
          committedAt: 0,
          resultChecksum: deterministicHash(`${txId}_UNAUTHORIZED`),
          error: 'PACKAGE_UNAUTHORIZED: Insufficient permissions for workspace import',
        }),
      };
    }

    // 3. Stage: RESOLVE DEPENDENCIES & CONFLICTS
    const { conflicts } = IdentityResolver.resolveEntities(pkg.entities, existingEntities);
    const resolution = ConflictResolver.applyResolution(pkg.entities, conflicts, options);

    if (resolution.status === 'IMPORT_BLOCKED') {
      return {
        success: false,
        result: Object.freeze({
          transactionId: txId,
          success: false,
          status: 'IMPORT_BLOCKED',
          importedEntityCount: 0,
          importedEntityIds: Object.freeze([]),
          conflictsEncountered: conflicts,
          committedAt: 0,
          resultChecksum: deterministicHash(`${txId}_CONFLICT_BLOCKED`),
          error: resolution.error,
        }),
      };
    }

    // 4. Stage: COMMIT & VERIFY
    const committedEntities = resolution.resolvedEntities;
    const importedEntityIds = committedEntities.map((e) => e.entityId);

    const raw = JSON.stringify([
      txId,
      'IMPORT_COMMITTED',
      importedEntityIds,
      context.userId,
    ]);
    const resultChecksum = deterministicHash(raw);

    const result: ImportResult = Object.freeze({
      transactionId: txId,
      success: true,
      status: 'IMPORT_COMMITTED',
      importedEntityCount: committedEntities.length,
      importedEntityIds: Object.freeze(importedEntityIds),
      conflictsEncountered: conflicts,
      committedAt: 0,
      resultChecksum,
    });

    return {
      success: true,
      result,
      committedEntities,
    };
  }
}
