/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.9: Space Clone Engine
 *
 * Deeply clones a Space with unique deterministic ID and explicit provenance without mutating source.
 */

import { PersonalSpace } from '../p68/types';
import { SpaceManager } from '../p68/spaceManager';
import { ProvenanceRecord } from './types';
import { ProvenanceEngine } from './provenance';
import { generateDeterministicCloneId } from './determinism';

export interface CloneResult {
  readonly clonedSpace: PersonalSpace;
  readonly provenance: ProvenanceRecord;
}

export class SpaceCloneEngine {
  private static cloneCounter = 0;

  public static cloneSpace(sourceSpace: PersonalSpace, cloneName?: string): CloneResult {
    this.cloneCounter++;
    const newSpaceId = generateDeterministicCloneId(sourceSpace.spaceId, this.cloneCounter);

    const provenance = ProvenanceEngine.createRecord(
      sourceSpace.spaceId,
      sourceSpace.spaceChecksum,
      'CLONE',
      '6.9.0',
      null,
      sourceSpace.metadata.lineageId
    );

    const baseData = {
      ...sourceSpace,
      spaceId: newSpaceId,
      name: cloneName || `${sourceSpace.name} (Clone)`,
      reality: Object.freeze({
        ...sourceSpace.reality,
        objects: Object.freeze(sourceSpace.reality.objects.map((o) => Object.freeze({ ...o }))),
      }),
      observers: Object.freeze(sourceSpace.observers.map((o) => Object.freeze({ ...o }))),
      metadata: Object.freeze({
        ...sourceSpace.metadata,
        sourceSpaceIdRef: sourceSpace.spaceId,
        lineageId: provenance.provenanceId,
      }),
      createdAt: 0,
      updatedAt: 0,
    };

    const spaceChecksum = SpaceManager.calculateChecksum(baseData);
    const clonedSpace: PersonalSpace = Object.freeze({
      ...baseData,
      spaceChecksum,
    });

    return Object.freeze({
      clonedSpace,
      provenance,
    });
  }
}
