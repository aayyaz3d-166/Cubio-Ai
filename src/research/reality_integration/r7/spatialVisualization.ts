/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R7: Spatial Visualization Engine
 *
 * Transforms R6 WorkspaceSpatialBinding into directional/distance R7VisualSpatialRelation.
 */

import { WorkspaceSpatialBinding } from '../r6/types';
import { R7VisualSpatialRelation } from './types';
import {
  generateDeterministicVisualSpatialId,
  generateDeterministicVisualObjectId,
  computeVisualSpatialChecksum,
} from './determinism';

export class SpatialVisualizationEngine {
  public static createVisualSpatialRelation(
    binding: WorkspaceSpatialBinding
  ): R7VisualSpatialRelation {
    const visualSpatialId = generateDeterministicVisualSpatialId(binding.workspaceSpatialId);
    const sourceVisualObjectId = generateDeterministicVisualObjectId(binding.sourceWorkspaceObjectId);
    const targetVisualObjectId = generateDeterministicVisualObjectId(binding.targetWorkspaceObjectId);

    const visualChecksum = computeVisualSpatialChecksum(
      visualSpatialId,
      binding.workspaceSpatialId,
      sourceVisualObjectId,
      targetVisualObjectId,
      binding.relationType,
      binding.distance,
      binding.direction
    );

    return Object.freeze({
      visualSpatialId,
      workspaceSpatialId: binding.workspaceSpatialId,
      realitySpatialId: binding.realitySpatialId,
      sourceVisualObjectId,
      targetVisualObjectId,
      relationType: binding.relationType,
      evidence: binding.evidence,
      certainty: binding.certainty,
      distance: binding.distance,
      direction: binding.direction,
      containment: binding.containment,
      visualChecksum,
    });
  }

  public static createVisualSpatialRelations(
    bindings: readonly WorkspaceSpatialBinding[]
  ): readonly R7VisualSpatialRelation[] {
    return Object.freeze(bindings.map((b) => SpatialVisualizationEngine.createVisualSpatialRelation(b)));
  }
}
