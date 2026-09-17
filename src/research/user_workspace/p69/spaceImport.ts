/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.9: Space Import Engine
 *
 * Imports research packages into independent Space domains with explicit provenance.
 */

import { PersonalSpace } from '../p68/types';
import { SpaceManager } from '../p68/spaceManager';
import { ResearchExportPackage, ImportResult, ImportValidationReport } from './types';
import { ImportValidator } from './importValidator';
import { ProvenanceEngine } from './provenance';
import { generateDeterministicImportId } from './determinism';

export class SpaceImportEngine {
  private static importCounter = 0;

  public static importPackage(
    pkg: unknown,
    targetUserId = 'USR_IMPORTER_01',
    customName?: string
  ): ImportResult {
    const validationReport = ImportValidator.validatePackage(pkg);
    if (!validationReport.isValid) {
      return Object.freeze({
        success: false,
        importedSpace: null,
        provenance: null,
        validationReport,
      });
    }

    const researchPkg = pkg as ResearchExportPackage;
    const sourceSpace = researchPkg.space;
    this.importCounter++;
    const newSpaceId = generateDeterministicImportId(sourceSpace.spaceId, this.importCounter);

    const provenance = ProvenanceEngine.createRecord(
      sourceSpace.spaceId,
      sourceSpace.spaceChecksum,
      'IMPORT',
      researchPkg.manifest.schemaVersion,
      researchPkg.manifest.exportId,
      sourceSpace.metadata.lineageId
    );

    const baseData = {
      ...sourceSpace,
      spaceId: newSpaceId,
      name: customName || `${sourceSpace.name} (Imported)`,
      metadata: Object.freeze({
        ...sourceSpace.metadata,
        ownerUserId: targetUserId,
        author: targetUserId,
        sourceSpaceIdRef: sourceSpace.spaceId,
        lineageId: provenance.provenanceId,
      }),
      createdAt: 0,
      updatedAt: 0,
    };

    const spaceChecksum = SpaceManager.calculateChecksum(baseData);
    const importedSpace: PersonalSpace = Object.freeze({
      ...baseData,
      spaceChecksum,
    });

    return Object.freeze({
      success: true,
      importedSpace,
      provenance,
      validationReport,
    });
  }
}
