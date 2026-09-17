/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.13: Version Diff Engine
 *
 * Deterministically compares two historical workspace states with fine-grained delta classification.
 */

import { CanonicalWorkspaceState, WorkspaceVersion, VersionDiff, DiffClassification } from './types';
import { generateDeterministicDiffId, deterministicHash } from './determinism';

export class VersionDiffEngine {
  public static compareVersions(
    versionA: WorkspaceVersion,
    versionB: WorkspaceVersion
  ): VersionDiff {
    return this.compareStates(
      versionA.statePayload,
      versionB.statePayload,
      versionA.versionId,
      versionB.versionId,
      versionB.versionType === 'BRANCH'
    );
  }

  public static compareStates(
    stateA: CanonicalWorkspaceState,
    stateB: CanonicalWorkspaceState,
    versionIdA = 'V_A',
    versionIdB = 'V_B',
    isBranch = false
  ): VersionDiff {
    const diffId = generateDeterministicDiffId(versionIdA, versionIdB);

    const changedReality = stateA.realityChecksum !== stateB.realityChecksum;
    const changedObservers =
      stateA.observers.length !== stateB.observers.length ||
      JSON.stringify(stateA.observers) !== JSON.stringify(stateB.observers);
    const changedModel = stateA.modelChecksum !== stateB.modelChecksum;
    const changedGeometry = stateA.geometryChecksum !== stateB.geometryChecksum;
    const changedDimension =
      stateA.dimension.dimensionType !== stateB.dimension.dimensionType ||
      stateA.dimension.activeDimensions !== stateB.dimension.activeDimensions;
    const changedView = JSON.stringify(stateA.view) !== JSON.stringify(stateB.view);
    const changedCollaboration = stateA.collaborationShareRef !== stateB.collaborationShareRef;

    // Object additions, removals, modifications
    const mapA = new Map(stateA.objects.map((o) => [o.id, o]));
    const mapB = new Map(stateB.objects.map((o) => [o.id, o]));

    const addedObjectIds: string[] = [];
    const removedObjectIds: string[] = [];
    const modifiedObjectIds: string[] = [];

    for (const [id, objB] of mapB) {
      if (!mapA.has(id)) {
        addedObjectIds.push(id);
      } else {
        const objA = mapA.get(id)!;
        if (
          objA.position[0] !== objB.position[0] ||
          objA.position[1] !== objB.position[1] ||
          objA.position[2] !== objB.position[2] ||
          objA.label !== objB.label ||
          objA.category !== objB.category
        ) {
          modifiedObjectIds.push(id);
        }
      }
    }

    for (const [id] of mapA) {
      if (!mapB.has(id)) {
        removedObjectIds.push(id);
      }
    }

    const changedObjects =
      addedObjectIds.length > 0 || removedObjectIds.length > 0 || modifiedObjectIds.length > 0;

    let overallClassification: DiffClassification = 'UNCHANGED';
    if (isBranch) {
      overallClassification = 'BRANCHED';
    } else if (addedObjectIds.length > 0 && removedObjectIds.length === 0 && modifiedObjectIds.length === 0) {
      overallClassification = 'ADDED';
    } else if (removedObjectIds.length > 0 && addedObjectIds.length === 0 && modifiedObjectIds.length === 0) {
      overallClassification = 'REMOVED';
    } else if (
      changedReality ||
      changedObjects ||
      changedObservers ||
      changedModel ||
      changedGeometry ||
      changedDimension ||
      changedView ||
      changedCollaboration
    ) {
      overallClassification = 'MODIFIED';
    }

    const raw = JSON.stringify([
      diffId,
      versionIdA,
      versionIdB,
      changedReality,
      changedObservers,
      changedObjects,
      changedModel,
      changedGeometry,
      changedDimension,
      changedView,
      changedCollaboration,
      addedObjectIds,
      removedObjectIds,
      modifiedObjectIds,
      overallClassification,
    ]);
    const diffChecksum = deterministicHash(raw);

    return Object.freeze({
      diffId,
      versionIdA,
      versionIdB,
      changedReality,
      changedObservers,
      changedObjects,
      changedModel,
      changedGeometry,
      changedDimension,
      changedView,
      changedCollaboration,
      addedObjectIds: Object.freeze(addedObjectIds),
      removedObjectIds: Object.freeze(removedObjectIds),
      modifiedObjectIds: Object.freeze(modifiedObjectIds),
      overallClassification,
      diffChecksum,
    });
  }
}
