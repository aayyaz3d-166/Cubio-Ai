/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.9: Space Export Engine
 *
 * Exports complete Space representations into deterministic JSON research packages.
 */

import { PersonalSpace, SavedStateRecord, ExperimentRecord } from '../p68/types';
import { ResearchExportPackage, ExportManifest, ExportClassification } from './types';
import { ChecksumManifoldEngine } from './checksumManifold';
import { ProvenanceEngine } from './provenance';
import { ImportValidator } from './importValidator';
import { generateDeterministicExportId, deterministicHash } from './determinism';

export class SpaceExportEngine {
  private static exportCounter = 0;

  public static exportSpace(
    space: PersonalSpace,
    savedStates: readonly SavedStateRecord[] = [],
    experiments: readonly ExperimentRecord[] = []
  ): ResearchExportPackage {
    this.exportCounter++;
    const exportId = generateDeterministicExportId(space.spaceId, this.exportCounter);
    const checksumManifold = ChecksumManifoldEngine.computeManifold(space, exportId);

    const provenance = ProvenanceEngine.createRecord(
      space.spaceId,
      space.spaceChecksum,
      'CREATE',
      '6.9.0',
      exportId,
      space.metadata.lineageId
    );

    // Initial package construction for validation test
    const preliminaryPackage: ResearchExportPackage = Object.freeze({
      manifest: Object.freeze({
        exportId,
        spaceId: space.spaceId,
        name: space.name,
        schemaVersion: '6.9.0',
        sourceChecksum: space.spaceChecksum,
        exportChecksum: checksumManifold.exportChecksum,
        classification: 'RESEARCH_EXPORT_READY' as ExportClassification,
        provenance,
        objectCount: space.reality.objects.length,
        observerCount: space.observers.length,
        savedStateCount: savedStates.length,
        exportedAt: 0,
      }),
      space: Object.freeze({ ...space }),
      checksumManifold,
      exportedSavedStates: Object.freeze(savedStates.map((st) => Object.freeze({ ...st }))),
      exportedExperiments: Object.freeze(experiments.map((e) => Object.freeze({ ...e }))),
    });

    const report = ImportValidator.validatePackage(preliminaryPackage);
    const classification: ExportClassification = report.isValid
      ? 'RESEARCH_EXPORT_READY'
      : 'RESEARCH_EXPORT_BLOCKED';

    const manifest: ExportManifest = Object.freeze({
      ...preliminaryPackage.manifest,
      classification,
    });

    return Object.freeze({
      ...preliminaryPackage,
      manifest,
    });
  }
}
