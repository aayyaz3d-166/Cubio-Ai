/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R7: Visualization Validator
 *
 * Validates R7 scene graph integrity, coordinate finiteness, and reference consistency.
 */

import {
  R7SceneGraph,
  R7VisualizationValidationReport,
  R7VisualizationValidationStatus,
} from './types';
import { deterministicHash } from './determinism';

export class VisualizationValidator {
  public static validateSceneGraph(
    sceneGraph: R7SceneGraph | null | undefined
  ): R7VisualizationValidationReport {
    if (!sceneGraph) {
      return Object.freeze({
        status: 'MISSING_WORKSPACE_BINDING',
        isValid: false,
        issues: Object.freeze(['SceneGraph is null or undefined']),
        reportChecksum: deterministicHash('NULL_SCENE'),
      });
    }

    const issues: string[] = [];

    if (!sceneGraph.workspaceId) {
      return Object.freeze({
        status: 'MISSING_WORKSPACE_BINDING',
        isValid: false,
        issues: Object.freeze(['Missing workspaceId in scene graph']),
        reportChecksum: deterministicHash('MISSING_WORKSPACE_BINDING'),
      });
    }

    if (!sceneGraph.realityStateId) {
      return Object.freeze({
        status: 'MISSING_REALITY_REFERENCE',
        isValid: false,
        issues: Object.freeze(['Missing realityStateId in scene graph']),
        reportChecksum: deterministicHash('MISSING_REALITY_REFERENCE'),
      });
    }

    // Node validation
    const nodeIds = new Set<string>();
    const visualObjectIds = new Set<string>();

    for (const node of sceneGraph.nodes) {
      if (nodeIds.has(node.nodeId)) {
        return Object.freeze({
          status: 'DUPLICATE_VISUAL_ID',
          isValid: false,
          issues: Object.freeze([`Duplicate node ID: ${node.nodeId}`]),
          reportChecksum: deterministicHash('DUPLICATE_NODE_ID'),
        });
      }
      nodeIds.add(node.nodeId);

      const vo = node.visualObject;
      if (visualObjectIds.has(vo.identity.visualObjectId)) {
        return Object.freeze({
          status: 'DUPLICATE_VISUAL_ID',
          isValid: false,
          issues: Object.freeze([`Duplicate visual object ID: ${vo.identity.visualObjectId}`]),
          reportChecksum: deterministicHash('DUPLICATE_VISUAL_ID'),
        });
      }
      visualObjectIds.add(vo.identity.visualObjectId);

      // Coordinate finiteness check
      const [x, y, z] = vo.transform.coordinates;
      if (
        !Number.isFinite(x) ||
        !Number.isFinite(y) ||
        !Number.isFinite(z) ||
        Number.isNaN(x) ||
        Number.isNaN(y) ||
        Number.isNaN(z)
      ) {
        return Object.freeze({
          status: 'NON_FINITE_COORDINATES',
          isValid: false,
          issues: Object.freeze([`Non-finite coordinates in visual object: ${vo.identity.visualObjectId}`]),
          reportChecksum: deterministicHash('NON_FINITE_COORDINATES'),
        });
      }

      // Dimension check
      if (vo.transform.dimensions) {
        const [w, h, d] = vo.transform.dimensions;
        if (w <= 0 || h <= 0 || d <= 0 || !Number.isFinite(w) || !Number.isFinite(h) || !Number.isFinite(d)) {
          return Object.freeze({
            status: 'INVALID_DIMENSIONS',
            isValid: false,
            issues: Object.freeze([`Invalid dimensions in visual object: ${vo.identity.visualObjectId}`]),
            reportChecksum: deterministicHash('INVALID_DIMENSIONS'),
          });
        }
      }
    }

    // Relationship orphan check
    for (const rel of sceneGraph.relationships) {
      if (!visualObjectIds.has(rel.sourceVisualObjectId) || !visualObjectIds.has(rel.targetVisualObjectId)) {
        return Object.freeze({
          status: 'ORPHAN_VISUAL_RELATION',
          isValid: false,
          issues: Object.freeze([`Orphan relationship reference: ${rel.visualRelationshipId}`]),
          reportChecksum: deterministicHash('ORPHAN_VISUAL_RELATION'),
        });
      }
    }

    // Spatial relation orphan check
    for (const sp of sceneGraph.spatialRelations) {
      if (!visualObjectIds.has(sp.sourceVisualObjectId) || !visualObjectIds.has(sp.targetVisualObjectId)) {
        return Object.freeze({
          status: 'ORPHAN_VISUAL_RELATION',
          isValid: false,
          issues: Object.freeze([`Orphan spatial relation reference: ${sp.visualSpatialId}`]),
          reportChecksum: deterministicHash('ORPHAN_SPATIAL_RELATION'),
        });
      }
    }

    const isValid = issues.length === 0;
    const status: R7VisualizationValidationStatus = isValid ? 'VISUALIZATION_VALID' : 'CHECKSUM_MISMATCH';
    const reportChecksum = deterministicHash(issues.join(';') + `_${status}`);

    return Object.freeze({
      status,
      isValid,
      issues: Object.freeze(issues),
      reportChecksum,
    });
  }
}
