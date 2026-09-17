/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.16: Backup Manifest Generator
 *
 * Generates deterministic backup manifests summarizing all entity counts,
 * Model and Geometry checksums, lineage distributions, and boundary constraints.
 */

import {
  BackupManifest,
  RecoverySpace,
  RecoveryExperiment,
  RecoverySavedState,
  RecoveryVersion,
  RecoveryModel,
  RecoveryGeometry,
} from './types';
import {
  generateDeterministicManifestId,
  deterministicHash,
} from './determinism';

export class BackupManifestEngine {
  public static generateManifest(params: {
    recoveryPointId: string;
    workspaceId: string;
    spaces: readonly RecoverySpace[];
    experiments: readonly RecoveryExperiment[];
    savedStates: readonly RecoverySavedState[];
    versions: readonly RecoveryVersion[];
    models: readonly RecoveryModel[];
    geometries: readonly RecoveryGeometry[];
    sourceChecksum: string;
    packageChecksum: string;
    validationStatus?: 'VALID' | 'BLOCKED';
  }): BackupManifest {
    const manifestId = generateDeterministicManifestId(params.recoveryPointId, '6.16.0');

    const sourceSpaceIds = [...new Set(params.spaces.map((s) => s.spaceId))].sort();

    const entityCounts = Object.freeze({
      spaces: params.spaces.length,
      experiments: params.experiments.length,
      savedStates: params.savedStates.length,
      versions: params.versions.length,
      models: params.models.length,
      geometries: params.geometries.length,
    });

    // Model and Geometry Checksums
    const sortedModelChecksums = params.models.map((m) => m.modelChecksum).sort();
    const modelChecksum = deterministicHash(JSON.stringify(sortedModelChecksums));

    const sortedGeoChecksums = params.geometries.map((g) => g.geometryChecksum).sort();
    const geometryChecksum = deterministicHash(JSON.stringify(sortedGeoChecksums));

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

    const raw = JSON.stringify([
      '6.16.0',
      params.recoveryPointId,
      params.workspaceId,
      sourceSpaceIds,
      entityCounts,
      modelChecksum,
      geometryChecksum,
      params.sourceChecksum,
      params.packageChecksum,
      lineageSummary,
      certaintySummary,
      validationStatus,
    ]);

    const manifestChecksum = deterministicHash(raw);

    return Object.freeze({
      manifestId,
      schemaVersion: '6.16.0',
      recoveryPointId: params.recoveryPointId,
      sourceWorkspaceId: params.workspaceId,
      sourceSpaceIds: Object.freeze(sourceSpaceIds),
      entityCounts,
      modelChecksum,
      geometryChecksum,
      sourceChecksum: params.sourceChecksum,
      packageChecksum: params.packageChecksum,
      lineageSummary: Object.freeze(lineageSummary),
      certaintySummary: Object.freeze(certaintySummary),
      validationStatus,
      createdAt: 0,
      manifestChecksum,
    });
  }
}
