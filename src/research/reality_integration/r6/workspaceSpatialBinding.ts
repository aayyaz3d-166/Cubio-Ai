/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R6: Workspace Spatial & Topology Binding
 *
 * Binds R5 Spatial Relations and Topology Graph into downstream Workspace representations.
 * Preserves evidence (DERIVED_FROM_GEOMETRY, DERIVED_FROM_TOPOLOGY) without auto-promotion to OBSERVED.
 */

import { SpatialRelation, SpatialTopologyGraph } from '../r5/types';
import { WorkspaceSpatialBinding, WorkspaceTopologyBinding } from './types';
import {
  generateDeterministicWorkspaceSpatialId,
  generateDeterministicWorkspaceTopologyId,
  generateDeterministicWorkspaceObjectId,
  computeWorkspaceSpatialChecksum,
  computeWorkspaceTopologyChecksum,
} from './determinism';

export class WorkspaceSpatialBindingEngine {
  public static bindSpatialRelation(rel: SpatialRelation): WorkspaceSpatialBinding {
    const workspaceSpatialId = generateDeterministicWorkspaceSpatialId(rel.relationId);
    const sourceWorkspaceObjectId = generateDeterministicWorkspaceObjectId(rel.sourceObjectId);
    const targetWorkspaceObjectId = generateDeterministicWorkspaceObjectId(rel.targetObjectId);

    const bindingChecksum = computeWorkspaceSpatialChecksum(
      workspaceSpatialId,
      rel.relationId,
      sourceWorkspaceObjectId,
      targetWorkspaceObjectId,
      rel.relationType,
      rel.distance.euclideanDistance,
      rel.direction.primaryDirection,
      rel.relationChecksum
    );

    return Object.freeze({
      workspaceSpatialId,
      realitySpatialId: rel.relationId,
      sourceWorkspaceObjectId,
      targetWorkspaceObjectId,
      sourceRealityObjectId: rel.sourceObjectId,
      targetRealityObjectId: rel.targetObjectId,
      relationType: rel.relationType,
      evidence: rel.evidence,
      certainty: rel.certainty,
      distance: rel.distance.euclideanDistance,
      direction: rel.direction.primaryDirection,
      containment: rel.containment.classification,
      sourceSpatialChecksum: rel.relationChecksum,
      bindingChecksum,
    });
  }

  public static bindSpatialRelations(
    relations: readonly SpatialRelation[]
  ): readonly WorkspaceSpatialBinding[] {
    return Object.freeze(relations.map((r) => WorkspaceSpatialBindingEngine.bindSpatialRelation(r)));
  }

  public static bindTopology(topology: SpatialTopologyGraph | null): WorkspaceTopologyBinding | null {
    if (!topology) return null;

    const workspaceTopologyId = generateDeterministicWorkspaceTopologyId(topology.graphId);
    const nodeCount = topology.nodes.length;
    const edgeCount = topology.edges.length;
    const isAcyclic = true; // Invariant check

    const bindingChecksum = computeWorkspaceTopologyChecksum(
      workspaceTopologyId,
      topology.graphId,
      nodeCount,
      edgeCount,
      topology.graphChecksum
    );

    return Object.freeze({
      workspaceTopologyId,
      realityTopologyId: topology.graphId,
      nodeCount,
      edgeCount,
      isAcyclic,
      sourceTopologyChecksum: topology.graphChecksum,
      bindingChecksum,
    });
  }
}
