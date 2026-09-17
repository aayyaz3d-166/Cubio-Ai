/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.24: Workspace Export Engine
 *
 * Serializes authoritative workspace entities into deterministic,
 * portable packages with cryptographic manifests.
 */

import {
  WorkspacePackage,
  PackageEntity,
  PortabilityPermissionContext,
  ExportOptions,
  PackageDependency,
} from './types';
import { PortabilityBoundaryEngine } from './portabilityBoundary';
import { PackageManifestBuilder } from './packageManifest';
import {
  generateDeterministicPackageId,
  generateDeterministicPackageChecksum,
} from './determinism';

export class WorkspaceExportEngine {
  public static exportSpace(
    spaceEntity: PackageEntity,
    attachedEntities: readonly PackageEntity[],
    context: PortabilityPermissionContext,
    options?: ExportOptions
  ): { success: boolean; package?: WorkspacePackage; error?: string } {
    const allEntities = [spaceEntity, ...attachedEntities];
    return this.createPackage(allEntities, context, 'SPACE', spaceEntity.spaceId, options);
  }

  public static exportExperiment(
    expEntity: PackageEntity,
    attachedEntities: readonly PackageEntity[],
    context: PortabilityPermissionContext,
    options?: ExportOptions
  ): { success: boolean; package?: WorkspacePackage; error?: string } {
    const allEntities = [expEntity, ...attachedEntities];
    return this.createPackage(allEntities, context, 'EXPERIMENT', expEntity.spaceId, options);
  }

  public static exportSavedState(
    stateEntity: PackageEntity,
    context: PortabilityPermissionContext,
    options?: ExportOptions
  ): { success: boolean; package?: WorkspacePackage; error?: string } {
    return this.createPackage([stateEntity], context, 'SAVED_STATE', stateEntity.spaceId, options);
  }

  public static exportVersion(
    versionEntity: PackageEntity,
    context: PortabilityPermissionContext,
    options?: ExportOptions
  ): { success: boolean; package?: WorkspacePackage; error?: string } {
    return this.createPackage([versionEntity], context, 'VERSION', versionEntity.spaceId, options);
  }

  public static exportWorkspace(
    entities: readonly PackageEntity[],
    context: PortabilityPermissionContext,
    options?: ExportOptions
  ): { success: boolean; package?: WorkspacePackage; error?: string } {
    return this.createPackage(entities, context, 'FULL_WORKSPACE', undefined, options);
  }

  private static createPackage(
    entities: readonly PackageEntity[],
    context: PortabilityPermissionContext,
    scope: 'SPACE' | 'EXPERIMENT' | 'SAVED_STATE' | 'VERSION' | 'FULL_WORKSPACE',
    sourceSpaceId?: string,
    options?: ExportOptions
  ): { success: boolean; package?: WorkspacePackage; error?: string } {
    // 1. Authorization check
    if (!PortabilityBoundaryEngine.canExport(context, entities)) {
      return { success: false, error: 'PACKAGE_UNAUTHORIZED: User not authorized to export these entities' };
    }

    // 2. Sanitize entities
    let sanitizedEntities: PackageEntity[];
    try {
      sanitizedEntities = entities.map((e) => PortabilityBoundaryEngine.sanitizeEntity(e));
    } catch (err: any) {
      return { success: false, error: err.message };
    }

    // Filter lifecycle states if options specified
    if (options) {
      if (!options.includeTrash) {
        sanitizedEntities = sanitizedEntities.filter((e) => e.lifecycleState !== 'TRASHED');
      }
      if (!options.includeArchive) {
        sanitizedEntities = sanitizedEntities.filter((e) => e.lifecycleState !== 'ARCHIVED');
      }
    }

    // 3. Sort entities deterministically
    const sortedEntities = [...sanitizedEntities].sort((a, b) => {
      const typeCmp = a.entityType.localeCompare(b.entityType);
      if (typeCmp !== 0) return typeCmp;
      return a.entityId.localeCompare(b.entityId);
    });

    const packageId = generateDeterministicPackageId(context.userId, scope, sortedEntities.length);

    // Collect dependencies
    const allDeps: PackageDependency[] = [];
    sortedEntities.forEach((e) => {
      if (e.dependencies) {
        allDeps.push(...e.dependencies);
      }
    });

    const manifest = PackageManifestBuilder.buildManifest({
      packageId,
      sourceOwnerId: context.userId,
      sourceSpaceId,
      exportScope: scope,
      entities: sortedEntities,
      dependencies: allDeps,
    });

    const packageChecksum = generateDeterministicPackageChecksum(
      manifest.manifestChecksum,
      sortedEntities.map((e) => e.checksum)
    );

    const pkg: WorkspacePackage = Object.freeze({
      packageId,
      schemaVersion: '6.24.0',
      manifest,
      entities: Object.freeze(sortedEntities),
      packageChecksum,
      createdAt: 0,
    });

    return {
      success: true,
      package: pkg,
    };
  }
}
