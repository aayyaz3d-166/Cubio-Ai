/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.15: Workspace Export Builder
 *
 * Constructs canonical, authorized, portable export packages.
 * Strips all authentication tokens, credentials, and payment data.
 * Respects OWNER, EDITOR, OBSERVER permission boundaries.
 */

import {
  WorkspaceExportPackage,
  PortabilityAccessContext,
  PortableSpace,
  PortableExperiment,
  PortableSavedState,
  PortableVersion,
  PortableTimeline,
  PortableModel,
  PortableGeometry,
} from './types';
import { ExportManifestEngine } from './exportManifest';
import {
  generateDeterministicPackageId,
  deterministicHash,
} from './determinism';

export class WorkspaceExportBuilder {
  private workspaceId: string;
  private ownerId: string;
  private accessContext: PortabilityAccessContext;

  private spaces: PortableSpace[] = [];
  private experiments: PortableExperiment[] = [];
  private savedStates: PortableSavedState[] = [];
  private versions: PortableVersion[] = [];
  private timelines: PortableTimeline[] = [];
  private models: PortableModel[] = [];
  private geometries: PortableGeometry[] = [];

  constructor(accessContext: PortabilityAccessContext) {
    this.accessContext = accessContext;
    this.workspaceId = accessContext.workspaceId;
    this.ownerId = accessContext.userId;
  }

  public addSpace(space: PortableSpace): this {
    if (this.isEntityAccessible(space.accessLevel, space.ownerId, space.spaceId)) {
      this.spaces.push(Object.freeze({ ...space }));
    }
    return this;
  }

  public addExperiment(exp: PortableExperiment): this {
    if (this.isEntityAccessible('PUBLIC', exp.ownerId, exp.spaceId)) {
      this.experiments.push(Object.freeze({ ...exp }));
    }
    return this;
  }

  public addSavedState(state: PortableSavedState): this {
    if (this.isEntityAccessible('PUBLIC', state.ownerId, state.spaceId)) {
      this.savedStates.push(Object.freeze({ ...state }));
    }
    return this;
  }

  public addVersion(version: PortableVersion): this {
    if (this.isEntityAccessible('PUBLIC', version.ownerId, version.spaceId)) {
      this.versions.push(Object.freeze({ ...version }));
    }
    return this;
  }

  public addTimeline(timeline: PortableTimeline): this {
    if (this.isEntityAccessible('PUBLIC', this.ownerId, timeline.spaceId)) {
      this.timelines.push(Object.freeze({ ...timeline }));
    }
    return this;
  }

  public addModel(model: PortableModel): this {
    if (this.isEntityAccessible('PUBLIC', this.ownerId, model.spaceId)) {
      this.models.push(Object.freeze({ ...model }));
    }
    return this;
  }

  public addGeometry(geometry: PortableGeometry): this {
    if (this.isEntityAccessible('PUBLIC', this.ownerId, geometry.spaceId)) {
      this.geometries.push(Object.freeze({ ...geometry }));
    }
    return this;
  }

  private isEntityAccessible(accessLevel: string, entityOwnerId: string, spaceId?: string): boolean {
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

  /**
   * Build the complete WorkspaceExportPackage.
   */
  public build(): WorkspaceExportPackage {
    // Deterministic sorting across all collections
    const sortedSpaces = [...this.spaces].sort((a, b) => a.spaceId.localeCompare(b.spaceId));
    const sortedExperiments = [...this.experiments].sort((a, b) => a.experimentId.localeCompare(b.experimentId));
    const sortedStates = [...this.savedStates].sort((a, b) => a.stateId.localeCompare(b.stateId));
    const sortedVersions = [...this.versions].sort((a, b) => a.versionId.localeCompare(b.versionId));
    const sortedTimelines = [...this.timelines].sort((a, b) => a.timelineId.localeCompare(b.timelineId));
    const sortedModels = [...this.models].sort((a, b) => a.modelId.localeCompare(b.modelId));
    const sortedGeometries = [...this.geometries].sort((a, b) => a.geometryId.localeCompare(b.geometryId));

    const totalCount =
      sortedSpaces.length +
      sortedExperiments.length +
      sortedStates.length +
      sortedVersions.length +
      sortedTimelines.length +
      sortedModels.length +
      sortedGeometries.length;

    const packageId = generateDeterministicPackageId(this.workspaceId, totalCount);

    const manifest = ExportManifestEngine.generateManifest({
      packageId,
      workspaceId: this.workspaceId,
      ownerId: this.ownerId,
      spaces: sortedSpaces,
      experiments: sortedExperiments,
      savedStates: sortedStates,
      versions: sortedVersions,
      timelines: sortedTimelines,
      models: sortedModels,
      geometries: sortedGeometries,
    });

    const rawPayload = JSON.stringify([
      '6.15.0',
      packageId,
      this.workspaceId,
      this.ownerId,
      manifest.manifestChecksum,
      sortedSpaces.map((s) => [s.spaceId, s.checksum]),
      sortedExperiments.map((e) => [e.experimentId, e.checksum]),
      sortedStates.map((st) => [st.stateId, st.checksum]),
      sortedVersions.map((v) => [v.versionId, v.checksum]),
      sortedModels.map((m) => [m.modelId, m.modelChecksum]),
      sortedGeometries.map((g) => [g.geometryId, g.geometryChecksum]),
    ]);

    const packageChecksum = deterministicHash(rawPayload);

    return Object.freeze({
      packageId,
      schemaVersion: '6.15.0',
      workspaceId: this.workspaceId,
      ownerId: this.ownerId,
      manifest,
      spaces: Object.freeze(sortedSpaces),
      experiments: Object.freeze(sortedExperiments),
      savedStates: Object.freeze(sortedStates),
      versions: Object.freeze(sortedVersions),
      timelines: Object.freeze(sortedTimelines),
      models: Object.freeze(sortedModels),
      geometries: Object.freeze(sortedGeometries),
      metadata: Object.freeze({}),
      packageChecksum,
      exportedAt: 0,
    });
  }
}
