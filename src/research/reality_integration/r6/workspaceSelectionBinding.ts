/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R6: Workspace Selection Binding
 *
 * Explicit selection mapping from Workspace -> Reality reference.
 * Invariant: Selection NEVER mutates Reality (Delta Reality = 0).
 */

import {
  WorkspaceSelectionState,
  WorkspaceObjectBinding,
  WorkspaceRelationshipBinding,
  WorkspaceSpatialBinding,
} from './types';

export class WorkspaceSelectionBindingEngine {
  public static createEmptySelection(): WorkspaceSelectionState {
    return Object.freeze({
      selectionType: 'NONE',
      selectedId: null,
    });
  }

  public static selectObject(obj: WorkspaceObjectBinding): WorkspaceSelectionState {
    return Object.freeze({
      selectionType: 'OBJECT',
      selectedId: obj.workspaceObjectId,
      realityReferenceId: obj.realityObjectId,
      realityStateId: obj.realityStateId,
      provenance: 'WORKSPACE_USER_SELECTION',
      certainty: obj.certainty,
      spatialDetails: Object.freeze({
        coordinates: obj.coordinates,
        dimensions: obj.dimensions,
      }),
    });
  }

  public static selectRelationship(rel: WorkspaceRelationshipBinding): WorkspaceSelectionState {
    return Object.freeze({
      selectionType: 'RELATIONSHIP',
      selectedId: rel.workspaceRelationshipId,
      realityReferenceId: rel.realityRelationshipId,
      provenance: 'WORKSPACE_USER_SELECTION',
      certainty: rel.certainty,
      spatialDetails: Object.freeze({
        relationshipType: rel.relationshipType,
        source: rel.sourceWorkspaceObjectId,
        target: rel.targetWorkspaceObjectId,
      }),
    });
  }

  public static selectSpatialRelation(spatial: WorkspaceSpatialBinding): WorkspaceSelectionState {
    return Object.freeze({
      selectionType: 'SPATIAL_RELATION',
      selectedId: spatial.workspaceSpatialId,
      realityReferenceId: spatial.realitySpatialId,
      provenance: 'WORKSPACE_USER_SELECTION',
      certainty: spatial.certainty,
      spatialDetails: Object.freeze({
        relationType: spatial.relationType,
        distance: spatial.distance,
        direction: spatial.direction,
        containment: spatial.containment,
      }),
    });
  }
}
