/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.9: Shareable Research Package Engine
 *
 * Encapsulates immutable export packages for controlled read-only sharing.
 */

import { PersonalSpace, SavedStateRecord, ExperimentRecord } from '../p68/types';
import { SharePackage, ResearchExportPackage } from './types';
import { SpaceExportEngine } from './spaceExport';
import { generateDeterministicSharePackageId, deterministicHash } from './determinism';

export class SharePackageEngine {
  private static shareCounter = 0;

  public static createSharePackage(
    space: PersonalSpace,
    savedStates: readonly SavedStateRecord[] = [],
    experiments: readonly ExperimentRecord[] = []
  ): SharePackage {
    this.shareCounter++;
    const sharePackageId = generateDeterministicSharePackageId(space.spaceId, this.shareCounter);
    const payload: ResearchExportPackage = SpaceExportEngine.exportSpace(space, savedStates, experiments);

    const checksum = deterministicHash(
      JSON.stringify([sharePackageId, payload.manifest.exportId, payload.manifest.exportChecksum])
    );

    return Object.freeze({
      sharePackageId,
      exportId: payload.manifest.exportId,
      sourceSpaceId: space.spaceId,
      name: space.name,
      schemaVersion: '6.9.0',
      checksum,
      isReadOnly: true,
      payload,
      createdAt: 0,
    });
  }
}
