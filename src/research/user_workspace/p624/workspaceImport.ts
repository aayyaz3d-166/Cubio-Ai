/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.24: Workspace Import Engine
 *
 * Provides high-level import orchestration including validation,
 * preview generation, transaction execution, and cancellation.
 */

import {
  WorkspacePackage,
  PackageEntity,
  PackageValidationReport,
  ImportPreview,
  ImportResult,
  PortabilityPermissionContext,
  ImportOptions,
} from './types';
import { PackageValidator } from './packageValidator';
import { IdentityResolver } from './identityResolver';
import { ImportPreviewGenerator } from './importPreview';
import { ImportTransactionCoordinator } from './importTransaction';

export class WorkspaceImportEngine {
  public static validatePackage(
    pkg: WorkspacePackage,
    context?: PortabilityPermissionContext
  ): PackageValidationReport {
    return PackageValidator.validatePackage(pkg, context);
  }

  public static previewImport(
    pkg: WorkspacePackage,
    existingEntities: readonly PackageEntity[]
  ): ImportPreview {
    const { conflicts } = IdentityResolver.resolveEntities(pkg.entities, existingEntities);
    return ImportPreviewGenerator.generatePreview(pkg, pkg.entities, conflicts);
  }

  public static importPackage(
    pkg: WorkspacePackage,
    existingEntities: readonly PackageEntity[],
    context: PortabilityPermissionContext,
    options?: ImportOptions
  ): { success: boolean; result: ImportResult; committedEntities?: readonly PackageEntity[] } {
    return ImportTransactionCoordinator.executeImport(pkg, existingEntities, context, options);
  }

  public static cancelImport(): { status: 'IMPORT_ROLLED_BACK'; message: string } {
    return {
      status: 'IMPORT_ROLLED_BACK',
      message: 'Import transaction was canceled before commit. No workspace mutation performed.',
    };
  }
}
