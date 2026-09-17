/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R2: Downstream Representation Propagation Adapters
 *
 * Explicitly connects Reality State -> Model -> Geometry -> Workspace.
 * Downstream representations NEVER mutate Reality.
 */

import {
  RealityState,
  RealityStateOrigin,
  R2ModelRepresentation,
  R2GeometryRepresentation,
  R2WorkspaceState,
} from './types';
import {
  deterministicHash,
  computeR2ModelChecksum,
  computeR2GeometryChecksum,
  computeR2WorkspaceChecksum,
} from './determinism';

export class RealityPropagationAdapters {
  public static adaptRealityToModel(realityState: RealityState): R2ModelRepresentation {
    const modelId = `MDL_R2_${deterministicHash(realityState.stateId)}`;
    const modelChecksum = computeR2ModelChecksum(
      modelId,
      realityState.stateId,
      realityState.coordinates,
      realityState.dimensions,
      realityState.certainty
    );

    return Object.freeze({
      modelId,
      sourceRealityStateId: realityState.stateId,
      coordinates: Object.freeze([...realityState.coordinates] as [number, number, number]),
      dimensions: Object.freeze([...realityState.dimensions] as [number, number, number]),
      certainty: realityState.certainty,
      modelChecksum,
      timestamp: 0,
    });
  }

  public static adaptModelToGeometry(model: R2ModelRepresentation, origin: RealityStateOrigin = 'OBSERVED'): R2GeometryRepresentation {
    const geometryId = `GEO_R2_${deterministicHash(model.modelId)}`;
    const geometryChecksum = computeR2GeometryChecksum(
      geometryId,
      model.modelId,
      model.coordinates,
      model.dimensions,
      origin
    );

    return Object.freeze({
      geometryId,
      sourceModelId: model.modelId,
      sourceRealityStateId: model.sourceRealityStateId,
      origin,
      coordinates: Object.freeze([...model.coordinates] as [number, number, number]),
      dimensions: Object.freeze([...model.dimensions] as [number, number, number]),
      geometryChecksum,
      timestamp: 0,
    });
  }

  public static adaptGeometryToWorkspace(geometry: R2GeometryRepresentation): R2WorkspaceState {
    const spaceId = `WS_R2_${deterministicHash(geometry.geometryId)}`;
    const workspaceChecksum = computeR2WorkspaceChecksum(
      spaceId,
      geometry.geometryId,
      geometry.coordinates,
      geometry.dimensions
    );

    return Object.freeze({
      spaceId,
      sourceGeometryId: geometry.geometryId,
      sourceRealityStateId: geometry.sourceRealityStateId,
      coordinates: Object.freeze([...geometry.coordinates] as [number, number, number]),
      dimensions: Object.freeze([...geometry.dimensions] as [number, number, number]),
      workspaceChecksum,
      timestamp: 0,
    });
  }
}
