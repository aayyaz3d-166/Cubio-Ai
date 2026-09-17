/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.15: Export Manifest Generator
 *
 * Generates deterministic export manifests detailing all entities, checksums,
 * lineages, certainty distributions, and boundary constraints in a package.
 */

import {
  ExportManifest,
  PortableSpace,
  PortableExperiment,
  PortableSavedState,
  PortableVersion,
  PortableTimeline,
  PortableModel,
  PortableGeometry,
} from './types';
import {
  generateDeterministicManifestId,
  deterministicHash,
} from './determinism';

export class ExportManifestEngine {
  public static generateManifest(params: {
    packageId: string;
    workspaceId: string;
    ownerId: string;
    spaces: readonly PortableSpace[];
    experiments: readonly PortableExperiment[];
    savedStates: readonly PortableSavedState[];
    versions: readonly PortableVersion[];
    timelines: readonly PortableTimeline[];
    models: readonly PortableModel[];
    geometries: readonly PortableGeometry[];
    validationStatus?: 'VALID' | 'BLOCKED';
  }): ExportManifest {
    const manifestId = generateDeterministicManifestId(params.packageId, '6.15.0');

    const sourceSpaceIds = [...new Set(params.spaces.map((s) => s.spaceId))].sort();

    // Deterministic checksums collection
    const checksums: Record<string, string> = {};
    params.spaces.forEach((s) => (checksums[`space:${s.spaceId}`] = s.checksum));
    params.experiments.forEach((e) => (checksums[`exp:${e.experimentId}`] = e.checksum));
    params.savedStates.forEach((st) => (checksums[`state:${st.stateId}`] = st.checksum));
    params.versions.forEach((v) => (checksums[`version:${v.versionId}`] = v.checksum));
    params.models.forEach((m) => (checksums[`model:${m.modelId}`] = m.modelChecksum));
    params.geometries.forEach((g) => (checksums[`geo:${g.geometryId}`] = g.geometryChecksum));

    // Lineage summary
    const lineageSet = new Set<string>();
    params.spaces.forEach((s) => lineageSet.add(s.lineageId));
    params.experiments.forEach((e) => lineageSet.add(e.lineageId));
    params.savedStates.forEach((st) => lineageSet.add(st.lineageId));
    params.versions.forEach((v) => lineageSet.add(v.lineageId));
    params.geometries.forEach((g) => lineageSet.add(g.lineageId));
    const lineageSummary = [...lineageSet].sort();

    // Certainty summary
    const certaintySummary: Record<string, number> = {
      EXACT: 0,
      CONSTRAINED: 0,
      AMBIGUOUS: 0,
      UNKNOWN: 0,
    };
    params.savedStates.forEach((st) => {
      certaintySummary[st.certainty] = (certaintySummary[st.certainty] || 0) + 1;
    });
    params.geometries.forEach((g) => {
      certaintySummary[g.certainty] = (certaintySummary[g.certainty] || 0) + 1;
    });

    const validationStatus = params.validationStatus ?? 'VALID';

    // Raw manifest string for deterministic hash
    const raw = JSON.stringify([
      '6.15.0',
      params.packageId,
      params.workspaceId,
      params.ownerId,
      sourceSpaceIds,
      params.spaces.length,
      params.experiments.length,
      params.savedStates.length,
      params.versions.length,
      params.timelines.length,
      params.models.length,
      params.geometries.length,
      checksums,
      lineageSummary,
      certaintySummary,
      validationStatus,
    ]);

    const manifestChecksum = deterministicHash(raw);

    return Object.freeze({
      manifestId,
      schemaVersion: '6.15.0',
      packageId: params.packageId,
      sourceWorkspaceId: params.workspaceId,
      sourceUserId: params.ownerId,
      sourceSpaceIds: Object.freeze(sourceSpaceIds),
      spaceCount: params.spaces.length,
      experimentCount: params.experiments.length,
      stateCount: params.savedStates.length,
      versionCount: params.versions.length,
      timelineCount: params.timelines.length,
      modelCount: params.models.length,
      geometryCount: params.geometries.length,
      checksums: Object.freeze(checksums),
      lineageSummary: Object.freeze(lineageSummary),
      certaintySummary: Object.freeze(certaintySummary),
      validationStatus,
      createdAt: 0,
      manifestChecksum,
    });
  }
}
