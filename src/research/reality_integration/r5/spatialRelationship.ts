/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R5: Spatial Relationship Engine
 *
 * Evaluates directional, metric, and containment relationships between objects.
 */

import {
  SpatialRelation,
  SpatialRelationType,
  SpatialRelationEvidence,
  SpatialRelationCertainty,
  SpatialRelationOrigin,
  SpatialRelationProvenance,
  SpatialRelationLineage,
} from './types';
import { RealityObject } from '../r4/types';
import { SpatialDistanceEngine } from './spatialDistance';
import { SpatialDirectionEngine } from './spatialDirection';
import { SpatialContainmentEngine } from './spatialContainment';
import {
  generateDeterministicSpatialRelationId,
  computeSpatialRelationChecksum,
} from './determinism';

export class SpatialRelationshipEngine {
  public static evaluateRelation(
    sourceObj: RealityObject,
    targetObj: RealityObject,
    targetRealityStateId: string = sourceObj.identity.targetRealityStateId,
    overrideType?: SpatialRelationType,
    evidence: SpatialRelationEvidence = 'DERIVED_FROM_GEOMETRY',
    certainty: SpatialRelationCertainty = 'EXACT',
    origin: SpatialRelationOrigin = 'DERIVED',
    evaluatorId = 'R5_SPATIAL_ENGINE',
    seq = 0
  ): SpatialRelation {
    const distance = SpatialDistanceEngine.calculateDistance(sourceObj.coordinates, targetObj.coordinates);
    const direction = SpatialDirectionEngine.evaluateDirection(sourceObj.coordinates, targetObj.coordinates);
    const containment = SpatialContainmentEngine.evaluateContainment(
      sourceObj.coordinates,
      sourceObj.dimensions,
      targetObj.coordinates,
      targetObj.dimensions
    );

    // Determine primary relation type if not explicitly overridden
    // SAME_POSITION takes priority over trivial containment at distance 0
    let relationType: SpatialRelationType = overrideType ?? direction.primaryDirection;
    if (!overrideType) {
      if (distance.metricClassification === 'SAME_POSITION') {
        relationType = 'SAME_POSITION';
      } else if (containment.classification === 'CONTAINS' || containment.classification === 'INSIDE') {
        relationType = containment.classification;
      }
    }

    const relationId = generateDeterministicSpatialRelationId(
      sourceObj.identity.objectId,
      targetObj.identity.objectId,
      relationType,
      seq
    );

    const provenance: SpatialRelationProvenance = Object.freeze({
      evaluatorId,
      method: evidence === 'OBSERVED' ? 'DIRECT_OBSERVATION' : 'COMPUTED_GEOMETRY_EVALUATION',
    });

    const lineage: SpatialRelationLineage = Object.freeze({
      lineageId: `SLIN_${relationId}`,
      rootRelationId: relationId,
      version: 1,
    });

    const relationChecksum = computeSpatialRelationChecksum(
      relationId,
      sourceObj.identity.objectId,
      targetObj.identity.objectId,
      targetRealityStateId,
      relationType,
      evidence,
      certainty,
      distance.euclideanDistance,
      direction.primaryDirection,
      containment.classification
    );

    return Object.freeze({
      relationId,
      sourceObjectId: sourceObj.identity.objectId,
      targetObjectId: targetObj.identity.objectId,
      targetRealityStateId,
      relationType,
      evidence,
      certainty,
      origin,
      distance,
      direction,
      containment,
      provenance,
      lineage,
      relationChecksum,
    });
  }
}
