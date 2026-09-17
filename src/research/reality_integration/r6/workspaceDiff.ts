/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R6: Workspace Diff Engine
 *
 * Deterministically compares two Workspace states.
 * Strictly distinguishes REALITY_DERIVED_CHANGE from WORKSPACE_ONLY_CHANGE.
 */

import {
  WorkspaceState,
  WorkspaceDiff,
  WorkspaceDiffType,
  WorkspaceDiffField,
} from './types';

export class WorkspaceDiffEngine {
  public static compareWorkspaces(wsA: WorkspaceState, wsB: WorkspaceState): WorkspaceDiff {
    const isIdentical = wsA.workspaceChecksum === wsB.workspaceChecksum;

    const realityStateChanged =
      wsA.realityBinding.realityStateChecksum !== wsB.realityBinding.realityStateChecksum;

    const realityStateField: WorkspaceDiffField<string> = Object.freeze({
      status: realityStateChanged ? 'CHANGED' : 'UNCHANGED',
      before: wsA.realityBinding.realityStateId,
      after: wsB.realityBinding.realityStateId,
    });

    // Objects diff
    const mapA = new Map(wsA.objects.map((o) => [o.workspaceObjectId, o]));
    const mapB = new Map(wsB.objects.map((o) => [o.workspaceObjectId, o]));

    const addedObjs: string[] = [];
    const removedObjs: string[] = [];
    const modifiedObjs: string[] = [];

    for (const [id, objB] of mapB) {
      const objA = mapA.get(id);
      if (!objA) {
        addedObjs.push(id);
      } else if (objA.bindingChecksum !== objB.bindingChecksum) {
        modifiedObjs.push(id);
      }
    }

    for (const id of mapA.keys()) {
      if (!mapB.has(id)) {
        removedObjs.push(id);
      }
    }

    // Relationships diff
    const relMapA = new Set(wsA.relationships.map((r) => r.workspaceRelationshipId));
    const relMapB = new Set(wsB.relationships.map((r) => r.workspaceRelationshipId));
    const addedRels = Array.from(relMapB).filter((id) => !relMapA.has(id));
    const removedRels = Array.from(relMapA).filter((id) => !relMapB.has(id));

    // Spatial diff
    const spMapA = new Set(wsA.spatialRelations.map((s) => s.workspaceSpatialId));
    const spMapB = new Set(wsB.spatialRelations.map((s) => s.workspaceSpatialId));
    const addedSpatial = Array.from(spMapB).filter((id) => !spMapA.has(id));
    const removedSpatial = Array.from(spMapA).filter((id) => !spMapB.has(id));

    // Selection diff
    const selectionChanged =
      wsA.selection.selectedId !== wsB.selection.selectedId ||
      wsA.selection.selectionType !== wsB.selection.selectionType;

    const selectionField: WorkspaceDiffField<typeof wsA.selection> = Object.freeze({
      status: selectionChanged ? 'CHANGED' : 'UNCHANGED',
      before: wsA.selection,
      after: wsB.selection,
    });

    // Camera diff
    const cameraChanged =
      wsA.camera.zoom !== wsB.camera.zoom ||
      wsA.camera.orbitAngle !== wsB.camera.orbitAngle ||
      wsA.camera.position[0] !== wsB.camera.position[0] ||
      wsA.camera.position[1] !== wsB.camera.position[1] ||
      wsA.camera.position[2] !== wsB.camera.position[2];

    const cameraField: WorkspaceDiffField<typeof wsA.camera> = Object.freeze({
      status: cameraChanged ? 'CHANGED' : 'UNCHANGED',
      before: wsA.camera,
      after: wsB.camera,
    });

    // Determine diff type
    let diffType: WorkspaceDiffType = 'NO_CHANGE';
    if (realityStateChanged || addedObjs.length > 0 || removedObjs.length > 0 || modifiedObjs.length > 0) {
      diffType = 'REALITY_DERIVED_CHANGE';
    } else if (selectionChanged || cameraChanged || !isIdentical) {
      diffType = 'WORKSPACE_ONLY_CHANGE';
    }

    return Object.freeze({
      workspaceAId: wsA.workspaceId,
      workspaceBId: wsB.workspaceId,
      diffType,
      realityStateChange: realityStateField,
      objectChanges: Object.freeze({
        added: Object.freeze(addedObjs),
        removed: Object.freeze(removedObjs),
        modified: Object.freeze(modifiedObjs),
      }),
      relationshipChanges: Object.freeze({
        added: Object.freeze(addedRels),
        removed: Object.freeze(removedRels),
      }),
      spatialChanges: Object.freeze({
        added: Object.freeze(addedSpatial),
        removed: Object.freeze(removedSpatial),
      }),
      selectionChange: selectionField,
      cameraChange: cameraField,
      isIdentical,
    });
  }
}
