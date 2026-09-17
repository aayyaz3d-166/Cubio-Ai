/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.10: Index Builder Engine
 *
 * Constructs deterministic IndexRecords from authoritative workspace entities.
 */

import { PersonalSpace, SavedStateRecord, ExperimentRecord, RecentViewRecord } from '../p68/types';
import { SharePackage } from '../p69/types';
import { IndexRecord } from './types';
import { generateDeterministicIndexRecordId } from './determinism';

export class IndexBuilder {
  public static buildSpaceRecord(space: PersonalSpace): IndexRecord {
    const recordId = generateDeterministicIndexRecordId(
      space.metadata.ownerUserId,
      'SPACE',
      space.spaceId
    );

    const isClone = space.spaceId.includes('_CLN_');
    const isImport = space.spaceId.includes('_IMP_');
    const entityType = isClone ? 'CLONE' : isImport ? 'IMPORT' : 'SPACE';

    return Object.freeze({
      recordId,
      entityType,
      entityId: space.spaceId,
      spaceId: space.spaceId,
      userId: space.metadata.ownerUserId,
      name: space.name,
      lineageId: space.metadata.lineageId,
      checksumRef: space.spaceChecksum,
      schemaVersion: space.schemaVersion,
      status: 'ACTIVE',
      isPinned: false,
      tags: Object.freeze([...space.metadata.tags]),
      createdAt: space.createdAt,
      updatedAt: space.updatedAt,
      lastViewedAt: space.updatedAt,
      objectCount: space.reality.objects.length,
      observerCount: space.observers.length,
      dimensionType: space.dimension.dimensionType,
      certainty: 'EXACT',
      provenanceSourceId: space.metadata.sourceSpaceIdRef,
    });
  }

  public static buildSavedStateRecord(
    state: SavedStateRecord,
    userId = 'USR_DEFAULT_01'
  ): IndexRecord {
    const recordId = generateDeterministicIndexRecordId(userId, 'SAVED_STATE', state.stateId);

    return Object.freeze({
      recordId,
      entityType: 'SAVED_STATE',
      entityId: state.stateId,
      spaceId: state.spaceId,
      userId,
      name: state.label,
      lineageId: null,
      checksumRef: state.stateChecksum,
      schemaVersion: state.schemaVersion,
      status: 'ACTIVE',
      isPinned: false,
      tags: Object.freeze(['saved-state', 'snapshot']),
      createdAt: state.createdAt,
      updatedAt: state.createdAt,
      lastViewedAt: state.createdAt,
      objectCount: state.reality.objects.length,
      observerCount: state.observers.length,
      dimensionType: state.dimension.dimensionType,
      certainty: 'EXACT',
      provenanceSourceId: state.spaceId,
    });
  }

  public static buildExperimentRecord(
    exp: ExperimentRecord,
    userId = 'USR_DEFAULT_01'
  ): IndexRecord {
    const recordId = generateDeterministicIndexRecordId(userId, 'EXPERIMENT', exp.experimentId);

    return Object.freeze({
      recordId,
      entityType: 'EXPERIMENT',
      entityId: exp.experimentId,
      spaceId: exp.spaceId,
      userId,
      name: exp.name,
      lineageId: exp.lineageId,
      checksumRef: exp.currentChecksum,
      schemaVersion: '6.10.0',
      status: 'ACTIVE',
      isPinned: false,
      tags: Object.freeze(['experiment', 'research']),
      createdAt: exp.createdAt,
      updatedAt: exp.updatedAt,
      lastViewedAt: exp.updatedAt,
      observerCount: exp.observers.length,
      dimensionType: exp.dimension.dimensionType,
      certainty: exp.certainty,
      provenanceSourceId: exp.spaceId,
    });
  }

  public static buildRecentViewRecord(
    rv: RecentViewRecord,
    userId = 'USR_DEFAULT_01'
  ): IndexRecord {
    const recordId = generateDeterministicIndexRecordId(userId, 'RECENT_VIEW', rv.viewId);

    return Object.freeze({
      recordId,
      entityType: 'RECENT_VIEW',
      entityId: rv.viewId,
      spaceId: rv.spaceId,
      userId,
      name: `View (${rv.view.viewportMode})`,
      lineageId: null,
      checksumRef: '00000000',
      schemaVersion: '6.10.0',
      status: 'ACTIVE',
      isPinned: false,
      tags: Object.freeze(['recent-view']),
      createdAt: rv.timestamp,
      updatedAt: rv.timestamp,
      lastViewedAt: rv.timestamp,
      dimensionType: rv.dimension.dimensionType,
      certainty: 'EXACT',
      provenanceSourceId: rv.spaceId,
    });
  }

  public static buildSharePackageRecord(
    pkg: SharePackage,
    userId = 'USR_DEFAULT_01'
  ): IndexRecord {
    const recordId = generateDeterministicIndexRecordId(userId, 'SHARE_PACKAGE', pkg.sharePackageId);

    return Object.freeze({
      recordId,
      entityType: 'SHARE_PACKAGE',
      entityId: pkg.sharePackageId,
      spaceId: pkg.sourceSpaceId,
      userId,
      name: pkg.name,
      lineageId: null,
      checksumRef: pkg.checksum,
      schemaVersion: pkg.schemaVersion,
      status: 'ACTIVE',
      isPinned: false,
      tags: Object.freeze(['share-package', 'read-only']),
      createdAt: pkg.createdAt,
      updatedAt: pkg.createdAt,
      lastViewedAt: pkg.createdAt,
      dimensionType: pkg.payload.space.dimension.dimensionType,
      certainty: 'EXACT',
      provenanceSourceId: pkg.sourceSpaceId,
    });
  }
}
