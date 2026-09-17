/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R7: Visual Relationship Engine
 *
 * Transforms R6 WorkspaceRelationshipBinding into visible R7VisualRelationship.
 * Preserves evidence (DERIVED_FROM_GEOMETRY vs OBSERVED) and certainty.
 */

import { WorkspaceRelationshipBinding } from '../r6/types';
import { R7VisualRelationship } from './types';
import {
  generateDeterministicVisualRelationshipId,
  generateDeterministicVisualObjectId,
  computeVisualRelationshipChecksum,
} from './determinism';

export class VisualRelationshipEngine {
  public static createVisualRelationship(
    binding: WorkspaceRelationshipBinding
  ): R7VisualRelationship {
    const visualRelationshipId = generateDeterministicVisualRelationshipId(
      binding.workspaceRelationshipId
    );
    const sourceVisualObjectId = generateDeterministicVisualObjectId(
      binding.sourceWorkspaceObjectId
    );
    const targetVisualObjectId = generateDeterministicVisualObjectId(
      binding.targetWorkspaceObjectId
    );

    // Color by relationship type
    let color = '#00FF88'; // default
    if (binding.relationshipType === 'CONTAINS' || binding.relationshipType === 'CONTAINED_BY') {
      color = '#38BDF8';
    } else if (binding.relationshipType === 'TOUCHES' || binding.relationshipType === 'ADJACENT_TO') {
      color = '#4ADE80';
    } else if (binding.relationshipType === 'OVERLAPS') {
      color = '#FBBF24';
    } else if (binding.relationshipType === 'SEPARATE_FROM') {
      color = '#94A3B8';
    }

    const visualChecksum = computeVisualRelationshipChecksum(
      visualRelationshipId,
      binding.workspaceRelationshipId,
      sourceVisualObjectId,
      targetVisualObjectId,
      binding.relationshipType,
      binding.evidence
    );

    return Object.freeze({
      visualRelationshipId,
      workspaceRelationshipId: binding.workspaceRelationshipId,
      realityRelationshipId: binding.realityRelationshipId,
      sourceVisualObjectId,
      targetVisualObjectId,
      relationshipType: binding.relationshipType,
      evidence: binding.evidence,
      certainty: binding.certainty,
      color,
      visualChecksum,
    });
  }

  public static createVisualRelationships(
    bindings: readonly WorkspaceRelationshipBinding[]
  ): readonly R7VisualRelationship[] {
    return Object.freeze(bindings.map((b) => VisualRelationshipEngine.createVisualRelationship(b)));
  }
}
