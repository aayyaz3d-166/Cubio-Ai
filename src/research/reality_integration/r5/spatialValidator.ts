/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R5: Spatial Validator
 *
 * Validates spatial relations, coordinates, dimensions, checksums, and topology integrity.
 */

import {
  SpatialRelation,
  SpatialTopologyGraph,
  SpatialValidationReport,
  SpatialValidationStatus,
} from './types';
import {
  computeSpatialRelationChecksum,
  deterministicHash,
} from './determinism';

export class SpatialValidator {
  public static validateRelation(
    rel: SpatialRelation | null | undefined,
    existingObjectIds?: ReadonlySet<string>
  ): SpatialValidationReport {
    if (!rel) {
      return Object.freeze({
        status: 'INVALID_RELATION_ID',
        isValid: false,
        issues: Object.freeze(['SpatialRelation is null or undefined']),
        reportChecksum: deterministicHash('NULL_RELATION'),
      });
    }

    const issues: string[] = [];

    if (!rel.relationId || !rel.targetRealityStateId) {
      issues.push('Invalid or missing relation identifier or Reality state reference');
    }

    if (rel.sourceObjectId === rel.targetObjectId) {
      return Object.freeze({
        status: 'INVALID_SELF_REFERENCE',
        isValid: false,
        issues: Object.freeze([`Invalid self-reference relationship on ${rel.sourceObjectId}`]),
        relationId: rel.relationId,
        reportChecksum: deterministicHash('INVALID_SELF_REFERENCE'),
      });
    }

    if (existingObjectIds) {
      if (!existingObjectIds.has(rel.sourceObjectId)) {
        return Object.freeze({
          status: 'MISSING_SOURCE_OBJECT',
          isValid: false,
          issues: Object.freeze([`Missing source object: ${rel.sourceObjectId}`]),
          relationId: rel.relationId,
          reportChecksum: deterministicHash('MISSING_SOURCE_OBJECT'),
        });
      }
      if (!existingObjectIds.has(rel.targetObjectId)) {
        return Object.freeze({
          status: 'MISSING_TARGET_OBJECT',
          isValid: false,
          issues: Object.freeze([`Missing target object: ${rel.targetObjectId}`]),
          relationId: rel.relationId,
          reportChecksum: deterministicHash('MISSING_TARGET_OBJECT'),
        });
      }
    }

    const [dx, dy, dz] = rel.distance.axisDeltas;
    const dist = rel.distance.euclideanDistance;

    if (
      !Number.isFinite(dx) || !Number.isFinite(dy) || !Number.isFinite(dz) || !Number.isFinite(dist) ||
      Number.isNaN(dx) || Number.isNaN(dy) || Number.isNaN(dz) || Number.isNaN(dist)
    ) {
      return Object.freeze({
        status: 'NON_FINITE_COORDINATES',
        isValid: false,
        issues: Object.freeze(['Non-finite coordinates or distance detected in spatial relation']),
        relationId: rel.relationId,
        reportChecksum: deterministicHash('NON_FINITE_COORDINATES'),
      });
    }

    const expectedChecksum = computeSpatialRelationChecksum(
      rel.relationId,
      rel.sourceObjectId,
      rel.targetObjectId,
      rel.targetRealityStateId,
      rel.relationType,
      rel.evidence,
      rel.certainty,
      rel.distance.euclideanDistance,
      rel.direction.primaryDirection,
      rel.containment.classification
    );

    if (rel.relationChecksum !== expectedChecksum) {
      return Object.freeze({
        status: 'CHECKSUM_MISMATCH',
        isValid: false,
        issues: Object.freeze([`Checksum mismatch. Expected ${expectedChecksum}, got ${rel.relationChecksum}`]),
        relationId: rel.relationId,
        reportChecksum: deterministicHash('CHECKSUM_MISMATCH'),
      });
    }

    const isValid = issues.length === 0;
    const status: SpatialValidationStatus = isValid ? 'SPATIAL_VALID' : 'INVALID_RELATION_ID';
    const reportChecksum = deterministicHash(issues.join(';') + `_${status}`);

    return Object.freeze({
      status,
      isValid,
      issues: Object.freeze(issues),
      relationId: rel.relationId,
      reportChecksum,
    });
  }

  public static validateTopologyGraph(graph: SpatialTopologyGraph): {
    isValid: boolean;
    issues: readonly string[];
    reportChecksum: string;
  } {
    const issues: string[] = [];
    const nodeIds = new Set<string>();

    for (const node of graph.nodes) {
      if (nodeIds.has(node.objectId)) {
        issues.push(`Duplicate node ID: ${node.objectId}`);
      }
      nodeIds.add(node.objectId);
    }

    const edgeIds = new Set<string>();
    for (const edge of graph.edges) {
      if (edgeIds.has(edge.edgeId)) {
        issues.push(`Duplicate edge ID: ${edge.edgeId}`);
      }
      edgeIds.add(edge.edgeId);

      const relReport = SpatialValidator.validateRelation(edge.relation, nodeIds);
      if (!relReport.isValid) {
        issues.push(...relReport.issues);
      }
    }

    const isValid = issues.length === 0;
    const reportChecksum = deterministicHash(issues.join(';') + `_${isValid}`);

    return Object.freeze({
      isValid,
      issues: Object.freeze(issues),
      reportChecksum,
    });
  }
}
