/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R7: Scene Graph Engine
 *
 * Constructs and manages the immutable R7SceneGraph representing the entire 3D visualization.
 */

import { WorkspaceState } from '../r6/types';
import {
  R7SceneGraph,
  R7SceneNode,
} from './types';
import { VisualObjectEngine } from './visualObject';
import { VisualRelationshipEngine } from './visualRelationship';
import { SpatialVisualizationEngine } from './spatialVisualization';
import { TopologyVisualizationEngine } from './topologyVisualization';
import {
  generateDeterministicSceneId,
  computeSceneChecksum,
} from './determinism';

export class SceneGraphEngine {
  public static buildSceneGraph(
    wsState: WorkspaceState,
    selectedObjectId: string | null = null,
    seq = 0
  ): R7SceneGraph {
    const sceneId = generateDeterministicSceneId(wsState.workspaceId, seq);

    const visualObjects = VisualObjectEngine.createVisualObjects(wsState.objects, selectedObjectId);
    const nodes: R7SceneNode[] = visualObjects.map((vo) =>
      Object.freeze({
        nodeId: `SNODE_${vo.identity.visualObjectId}`,
        visualObject: vo,
        children: Object.freeze([]),
      })
    );

    const relationships = VisualRelationshipEngine.createVisualRelationships(wsState.relationships);
    const spatialRelations = SpatialVisualizationEngine.createVisualSpatialRelations(wsState.spatialRelations);

    // Build topology edges from spatial relations
    const topologyPairs = wsState.spatialRelations.map((sp) => ({
      source: sp.sourceWorkspaceObjectId,
      target: sp.targetWorkspaceObjectId,
      isDirect: true,
      hopCount: 1,
    }));
    const topologyEdges = TopologyVisualizationEngine.createTopologyEdgesFromPairs(topologyPairs);

    const nodeChecksums = nodes.map((n) => n.visualObject.visualChecksum);
    const relChecksums = relationships.map((r) => r.visualChecksum);
    const spChecksums = spatialRelations.map((s) => s.visualChecksum);
    const edgeChecksums = topologyEdges.map((e) => e.visualChecksum);

    const sceneChecksum = computeSceneChecksum(
      sceneId,
      wsState.workspaceId,
      nodeChecksums,
      relChecksums,
      spChecksums,
      edgeChecksums
    );

    return Object.freeze({
      sceneId,
      realityStateId: wsState.realityBinding.realityStateId,
      workspaceId: wsState.workspaceId,
      nodes: Object.freeze(nodes),
      relationships: Object.freeze(relationships),
      spatialRelations: Object.freeze(spatialRelations),
      topologyEdges: Object.freeze(topologyEdges),
      sceneChecksum,
    });
  }
}
