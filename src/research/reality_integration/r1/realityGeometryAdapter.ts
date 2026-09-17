/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R1: Reality/Model -> Geometry Adapter
 *
 * Maps Model representation to downstream Geometry representation.
 * Explicitly tracks origin classification (OBSERVED, RECONSTRUCTED, DERIVED, AMBIGUOUS).
 */

import {
  ModelRepresentation,
  GeometryRepresentation,
  GeometryOriginClassification,
  RealityStateReference,
} from './types';
import {
  generateDeterministicGeometryId,
  computeGeometryChecksum,
  deterministicHash,
} from './determinism';

export class RealityGeometryAdapter {
  public static adaptModelToGeometry(
    model: ModelRepresentation,
    originClassification: GeometryOriginClassification = 'OBSERVED'
  ): GeometryRepresentation {
    const geometryId = generateDeterministicGeometryId(model.modelId);
    const geometryChecksum = computeGeometryChecksum(
      geometryId,
      model.modelId,
      model.coordinates,
      model.dimensions,
      originClassification
    );

    return Object.freeze({
      geometryId,
      sourceRealityId: model.sourceRealityId,
      sourceModelId: model.modelId,
      originClassification,
      coordinates: Object.freeze([...model.coordinates] as [number, number, number]),
      dimensions: Object.freeze([...model.dimensions] as [number, number, number]),
      certainty: model.certainty,
      lineageId: `LIN_GEO_${geometryId}`,
      geometryChecksum,
      timestamp: 0,
    });
  }

  public static createGeometryReference(model: ModelRepresentation, geometry: GeometryRepresentation): RealityStateReference {
    const raw = JSON.stringify([model.sourceStateId, geometry.geometryId, geometry.geometryChecksum]);
    return Object.freeze({
      referenceId: `REF_GEO_${deterministicHash(raw)}`,
      targetRealityId: model.sourceRealityId,
      targetStateId: model.sourceStateId,
      domain: 'GEOMETRY',
      representationId: geometry.geometryId,
      referenceChecksum: geometry.geometryChecksum,
    });
  }
}
