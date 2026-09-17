/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R6: Workspace State Synchronization Engine
 *
 * Manages live synchronization between Reality State and Workspace representations.
 * Detects STALE, SYNCED, INVALID states when Reality mutations occur.
 */

import {
  WorkspaceState,
  WorkspaceSyncStatus,
  WorkspaceRealityBinding,
} from './types';
import { RealityState } from '../r2/types';
import { RealityObject } from '../r4/types';
import { RealityRelationship } from '../r4/types';
import { SpatialRelation, SpatialTopologyGraph } from '../r5/types';
import { WorkspaceObjectBindingEngine } from './workspaceObjectBinding';
import { WorkspaceRelationshipBindingEngine } from './workspaceRelationshipBinding';
import { WorkspaceSpatialBindingEngine } from './workspaceSpatialBinding';
import { WorkspaceRealityStateEngine } from './workspaceRealityState';

export class WorkspaceStateSyncEngine {
  public static evaluateSyncStatus(
    workspaceState: WorkspaceState,
    currentRealityState: RealityState
  ): WorkspaceSyncStatus {
    if (!workspaceState.realityBinding) return 'UNKNOWN';

    if (workspaceState.realityBinding.realityStateId !== currentRealityState.stateId) {
      return 'STALE';
    }

    if (workspaceState.realityBinding.realityStateChecksum !== currentRealityState.checksum) {
      return 'STALE';
    }

    return 'SYNCED';
  }

  public static resynchronize(
    workspaceState: WorkspaceState,
    newRealityState: RealityState,
    objects: readonly RealityObject[],
    relationships: readonly RealityRelationship[] = [],
    spatialRelations: readonly SpatialRelation[] = [],
    topology: SpatialTopologyGraph | null = null
  ): WorkspaceState {
    const boundObjects = WorkspaceObjectBindingEngine.bindObjects(objects);
    const boundRelationships = WorkspaceRelationshipBindingEngine.bindRelationships(relationships);
    const boundSpatial = WorkspaceSpatialBindingEngine.bindSpatialRelations(spatialRelations);
    const boundTopology = WorkspaceSpatialBindingEngine.bindTopology(topology);

    const realityId =
      (newRealityState as any).realityId ??
      workspaceState.realityBinding?.realityId ??
      'REALITY_CANONICAL_ROOT';

    return WorkspaceRealityStateEngine.createWorkspaceState(
      realityId,
      newRealityState.stateId,
      newRealityState.checksum,
      boundObjects,
      boundRelationships,
      boundSpatial,
      boundTopology,
      workspaceState.selection,
      workspaceState.camera,
      workspaceState.uiPanels,
      workspaceState.version + 1
    );
  }

  public static markStale(workspaceState: WorkspaceState): WorkspaceState {
    const updatedBinding: WorkspaceRealityBinding = Object.freeze({
      ...workspaceState.realityBinding,
      syncStatus: 'STALE',
    });

    return Object.freeze({
      ...workspaceState,
      realityBinding: updatedBinding,
    });
  }
}
