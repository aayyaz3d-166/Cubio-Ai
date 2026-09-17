/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.24: Workspace Package Manifest Generator
 *
 * Constructs deterministic manifest headers cataloging exported entities,
 * schema specifications, and cryptographic checksums.
 */

import {
  WorkspacePackageManifest,
  PackageEntity,
  PackageDependency,
} from './types';
import {
  generateDeterministicManifestId,
  deterministicHash,
} from './determinism';

export class PackageManifestBuilder {
  public static buildManifest(params: {
    packageId: string;
    sourceOwnerId: string;
    sourceSpaceId?: string;
    exportScope: 'SPACE' | 'EXPERIMENT' | 'SAVED_STATE' | 'VERSION' | 'FULL_WORKSPACE';
    entities: readonly PackageEntity[];
    dependencies?: readonly PackageDependency[];
  }): WorkspacePackageManifest {
    const manifestId = generateDeterministicManifestId(params.packageId);

    // Deterministic sorting of entity summaries by entityType then entityId
    const sortedEntities = [...params.entities].sort((a, b) => {
      const typeCmp = a.entityType.localeCompare(b.entityType);
      if (typeCmp !== 0) return typeCmp;
      return a.entityId.localeCompare(b.entityId);
    });

    const entitySummaries = sortedEntities.map((e) =>
      Object.freeze({
        entityId: e.entityId,
        entityType: e.entityType,
        checksum: e.checksum,
        lineageId: e.lineageId,
      })
    );

    const dependencies = params.dependencies ? Object.freeze([...params.dependencies]) : Object.freeze([]);

    const raw = JSON.stringify([
      '6.24.0',
      manifestId,
      params.packageId,
      params.sourceSpaceId ?? '',
      params.sourceOwnerId,
      params.exportScope,
      entitySummaries,
      dependencies,
    ]);
    const manifestChecksum = deterministicHash(raw);

    return Object.freeze({
      manifestId,
      schemaVersion: '6.24.0',
      packageId: params.packageId,
      sourceSpaceId: params.sourceSpaceId,
      sourceOwnerId: params.sourceOwnerId,
      exportScope: params.exportScope,
      entityCount: entitySummaries.length,
      entitySummaries: Object.freeze(entitySummaries),
      dependencies,
      createdAt: 0,
      manifestChecksum,
    });
  }
}
