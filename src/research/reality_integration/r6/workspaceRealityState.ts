/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R6: Workspace Reality State Factory
 *
 * Constructs deeply immutable WorkspaceState objects from reality bindings,
 * object bindings, relationship bindings, spatial bindings, camera, and selection.
 */

import {
  WorkspaceState,
  WorkspaceRealityBinding,
  WorkspaceObjectBinding,
  WorkspaceRelationshipBinding,
  WorkspaceSpatialBinding,
  WorkspaceTopologyBinding,
  WorkspaceSelectionState,
  WorkspaceCameraState,
} from './types';
import {
  generateDeterministicWorkspaceId,
  computeWorkspaceChecksum,
} from './determinism';

export class WorkspaceRealityStateEngine {
  public static readonly DEFAULT_CAMERA: WorkspaceCameraState = Object.freeze({
    position: Object.freeze([0, -10, 5] as [number, number, number]),
    target: Object.freeze([5, 3, 6] as [number, number, number]), // Canonical contract target
    zoom: 1.0,
    orbitAngle: 0.0,
    isOrtho: false,
  });

  public static readonly DEFAULT_SELECTION: WorkspaceSelectionState = Object.freeze({
    selectionType: 'NONE',
    selectedId: null,
  });

  public static createWorkspaceState(
    realityId: string = 'REALITY_CANONICAL_ROOT',
    realityStateId: string,
    realityStateChecksum: string,
    objects: readonly WorkspaceObjectBinding[] = [],
    relationships: readonly WorkspaceRelationshipBinding[] = [],
    spatialRelations: readonly WorkspaceSpatialBinding[] = [],
    topology: WorkspaceTopologyBinding | null = null,
    selection: WorkspaceSelectionState = WorkspaceRealityStateEngine.DEFAULT_SELECTION,
    camera: WorkspaceCameraState = WorkspaceRealityStateEngine.DEFAULT_CAMERA,
    uiPanels: Readonly<Record<string, unknown>> = Object.freeze({}),
    version = 1,
    seq = 0
  ): WorkspaceState {
    const finalRealityId = realityId || 'REALITY_CANONICAL_ROOT';
    const workspaceId = generateDeterministicWorkspaceId(realityStateId, seq);

    const realityBinding: WorkspaceRealityBinding = Object.freeze({
      realityId: finalRealityId,
      realityStateId,
      realityStateChecksum,
      syncStatus: 'SYNCED',
      lastSyncedRealityChecksum: realityStateChecksum,
    });

    const objChecksums = objects.map((o) => o.bindingChecksum);
    const relChecksums = relationships.map((r) => r.bindingChecksum);
    const spChecksums = spatialRelations.map((s) => s.bindingChecksum);
    const topoChecksum = topology ? topology.bindingChecksum : null;

    const workspaceChecksum = computeWorkspaceChecksum(
      workspaceId,
      realityStateId,
      realityStateChecksum,
      objChecksums,
      relChecksums,
      spChecksums,
      topoChecksum,
      selection.selectedId,
      camera.zoom
    );

    return Object.freeze({
      workspaceId,
      realityBinding,
      objects: Object.freeze([...objects]),
      relationships: Object.freeze([...relationships]),
      spatialRelations: Object.freeze([...spatialRelations]),
      topology,
      selection: Object.freeze({ ...selection }),
      camera: Object.freeze({
        ...camera,
        position: Object.freeze([...camera.position] as [number, number, number]),
        target: Object.freeze([...camera.target] as [number, number, number]),
      }),
      uiPanels: Object.freeze({ ...uiPanels }),
      workspaceChecksum,
      version,
    });
  }
}
