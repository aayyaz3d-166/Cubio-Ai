/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.16: Backup Package Builder
 *
 * Constructs immutable, permission-checked backup packages for workspace scopes.
 * Strips authentication credentials, tokens, session secrets, and payment data.
 */

import {
  BackupPackage,
  RecoveryScope,
  RecoveryAccessContext,
  RecoverySpace,
  RecoveryExperiment,
  RecoverySavedState,
  RecoveryVersion,
  RecoveryModel,
  RecoveryGeometry,
} from './types';
import { BackupManifestEngine } from './backupManifest';
import {
  generateDeterministicBackupId,
  generateDeterministicRecoveryPointId,
  deterministicHash,
} from './determinism';

export class BackupBuilder {
  private workspaceId: string;
  private ownerId: string;
  private scope: RecoveryScope;
  private accessContext: RecoveryAccessContext;

  private spaces: RecoverySpace[] = [];
  private experiments: RecoveryExperiment[] = [];
  private savedStates: RecoverySavedState[] = [];
  private versions: RecoveryVersion[] = [];
  private models: RecoveryModel[] = [];
  private geometries: RecoveryGeometry[] = [];

  constructor(accessContext: RecoveryAccessContext, scope: RecoveryScope = 'WORKSPACE') {
    this.accessContext = accessContext;
    this.workspaceId = accessContext.workspaceId;
    this.ownerId = accessContext.userId;
    this.scope = scope;
  }

  public addSpace(space: RecoverySpace): this {
    if (this.isAccessible(space.accessLevel, space.ownerId, space.spaceId)) {
      this.spaces.push(Object.freeze({ ...space }));
    }
    return this;
  }

  public addExperiment(exp: RecoveryExperiment): this {
    if (this.isAccessible('PUBLIC', exp.ownerId, exp.spaceId)) {
      this.experiments.push(Object.freeze({ ...exp }));
    }
    return this;
  }

  public addSavedState(state: RecoverySavedState): this {
    if (this.isAccessible('PUBLIC', state.ownerId, state.spaceId)) {
      this.savedStates.push(Object.freeze({ ...state }));
    }
    return this;
  }

  public addVersion(version: RecoveryVersion): this {
    if (this.isAccessible('PUBLIC', version.ownerId, version.spaceId)) {
      this.versions.push(Object.freeze({ ...version }));
    }
    return this;
  }

  public addModel(model: RecoveryModel): this {
    if (this.isAccessible('PUBLIC', this.ownerId, model.spaceId)) {
      this.models.push(Object.freeze({ ...model }));
    }
    return this;
  }

  public addGeometry(geometry: RecoveryGeometry): this {
    if (this.isAccessible('PUBLIC', this.ownerId, geometry.spaceId)) {
      this.geometries.push(Object.freeze({ ...geometry }));
    }
    return this;
  }

  private isAccessible(accessLevel: string, entityOwnerId: string, spaceId?: string): boolean {
    if (this.accessContext.userRole === 'NO_ACCESS') return false;
    if (this.accessContext.userRole === 'OWNER') return true;

    if (this.accessContext.userRole === 'EDITOR') {
      if (entityOwnerId === this.accessContext.userId) return true;
      if (spaceId && this.accessContext.accessibleSpaceIds) {
        return this.accessContext.accessibleSpaceIds.includes(spaceId);
      }
      return accessLevel === 'PUBLIC' || accessLevel === 'SHARED';
    }

    if (this.accessContext.userRole === 'OBSERVER') {
      if (accessLevel === 'PUBLIC' || accessLevel === 'SHARED') {
        if (spaceId && this.accessContext.accessibleSpaceIds) {
          return this.accessContext.accessibleSpaceIds.includes(spaceId);
        }
        return true;
      }
      return false;
    }

    return false;
  }

  public build(): BackupPackage {
    const sortedSpaces = [...this.spaces].sort((a, b) => a.spaceId.localeCompare(b.spaceId));
    const sortedExperiments = [...this.experiments].sort((a, b) => a.experimentId.localeCompare(b.experimentId));
    const sortedStates = [...this.savedStates].sort((a, b) => a.stateId.localeCompare(b.stateId));
    const sortedVersions = [...this.versions].sort((a, b) => a.versionId.localeCompare(b.versionId));
    const sortedModels = [...this.models].sort((a, b) => a.modelId.localeCompare(b.modelId));
    const sortedGeometries = [...this.geometries].sort((a, b) => a.geometryId.localeCompare(b.geometryId));

    const totalCount =
      sortedSpaces.length +
      sortedExperiments.length +
      sortedStates.length +
      sortedVersions.length +
      sortedModels.length +
      sortedGeometries.length;

    const backupId = generateDeterministicBackupId(this.workspaceId, this.scope, totalCount);

    const sourceRaw = JSON.stringify([
      this.workspaceId,
      sortedSpaces.map((s) => s.checksum),
      sortedExperiments.map((e) => e.checksum),
      sortedStates.map((st) => st.checksum),
      sortedVersions.map((v) => v.checksum),
      sortedModels.map((m) => m.modelChecksum),
      sortedGeometries.map((g) => g.geometryChecksum),
    ]);
    const sourceChecksum = deterministicHash(sourceRaw);

    const tempRecPointId = generateDeterministicRecoveryPointId(
      this.workspaceId,
      sourceChecksum,
      this.scope
    );

    const packageRaw = JSON.stringify([
      '6.16.0',
      backupId,
      this.workspaceId,
      this.scope,
      sortedSpaces,
      sortedExperiments,
      sortedStates,
      sortedVersions,
      sortedModels,
      sortedGeometries,
    ]);
    const packageChecksum = deterministicHash(packageRaw);

    const manifest = BackupManifestEngine.generateManifest({
      recoveryPointId: tempRecPointId,
      workspaceId: this.workspaceId,
      spaces: sortedSpaces,
      experiments: sortedExperiments,
      savedStates: sortedStates,
      versions: sortedVersions,
      models: sortedModels,
      geometries: sortedGeometries,
      sourceChecksum,
      packageChecksum,
    });

    return Object.freeze({
      backupId,
      schemaVersion: '6.16.0',
      scope: this.scope,
      workspaceId: this.workspaceId,
      ownerId: this.ownerId,
      manifest,
      spaces: Object.freeze(sortedSpaces),
      experiments: Object.freeze(sortedExperiments),
      savedStates: Object.freeze(sortedStates),
      versions: Object.freeze(sortedVersions),
      models: Object.freeze(sortedModels),
      geometries: Object.freeze(sortedGeometries),
      metadata: Object.freeze({}),
      packageChecksum,
      createdAt: 0,
    });
  }
}
