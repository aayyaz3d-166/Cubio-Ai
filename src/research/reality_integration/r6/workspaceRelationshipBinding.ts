/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R6: Workspace Relationship Binding
 *
 * Binds R4 RealityRelationship into deterministic downstream WorkspaceRelationshipBinding.
 */

import { RealityRelationship } from '../r4/types';
import { WorkspaceRelationshipBinding } from './types';
import {
  generateDeterministicWorkspaceRelationshipId,
  generateDeterministicWorkspaceObjectId,
  computeWorkspaceRelationshipChecksum,
} from './determinism';

export class WorkspaceRelationshipBindingEngine {
  public static bindRelationship(rel: RealityRelationship): WorkspaceRelationshipBinding {
    const workspaceRelationshipId = generateDeterministicWorkspaceRelationshipId(rel.relationshipId);
    const sourceWorkspaceObjectId = generateDeterministicWorkspaceObjectId(rel.sourceObjectId);
    const targetWorkspaceObjectId = generateDeterministicWorkspaceObjectId(rel.targetObjectId);

    const bindingChecksum = computeWorkspaceRelationshipChecksum(
      workspaceRelationshipId,
      rel.relationshipId,
      sourceWorkspaceObjectId,
      targetWorkspaceObjectId,
      rel.relationshipType,
      rel.relationshipChecksum
    );

    return Object.freeze({
      workspaceRelationshipId,
      realityRelationshipId: rel.relationshipId,
      sourceWorkspaceObjectId,
      targetWorkspaceObjectId,
      sourceRealityObjectId: rel.sourceObjectId,
      targetRealityObjectId: rel.targetObjectId,
      relationshipType: rel.relationshipType,
      evidence: rel.evidence,
      certainty: rel.certainty,
      origin: rel.origin,
      sourceRelationshipChecksum: rel.relationshipChecksum,
      bindingChecksum,
    });
  }

  public static bindRelationships(
    relationships: readonly RealityRelationship[]
  ): readonly WorkspaceRelationshipBinding[] {
    return Object.freeze(relationships.map((r) => WorkspaceRelationshipBindingEngine.bindRelationship(r)));
  }
}
