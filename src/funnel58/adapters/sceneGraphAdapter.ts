/**
 * 3D Memory Studio — Funnel 58
 * Scene Graph ↔ Graph Engine Synchronizer Adapter
 */

import { SceneEngine } from '../../funnel56/scene/sceneEngine';
import { GraphModel } from '../graph/graphModel';
import { GraphRegistry } from '../graph/graphRegistry';
import { GraphEdgeMesh } from '../edges/graphEdge';

export function syncSceneNodesToGraph(
  sceneEngine: SceneEngine,
  model: GraphModel,
  registry: GraphRegistry,
  edgeMeshes: Map<string, GraphEdgeMesh>
): void {
  for (const node of model.getAllNodes()) {
    const sceneObj = sceneEngine.registry.get(node.stateId);
    if (sceneObj) {
      const [wx, wy, wz] = sceneObj.worldTransform.position;
      node.position = [wx, wy, wz];
      node.visible = sceneObj.visible && sceneObj.enabled;

      // Update connected edges endpoints
      const connected = registry.getBySource(node.stateId);
      for (const rel of connected) {
        rel.sourcePos = [wx, wy, wz];
        const mesh = edgeMeshes.get(rel.relationshipId);
        if (mesh) {
          mesh.updateEndpoints(rel.sourcePos, rel.targetPos);
        }
      }

      const targetConnected = registry.getByTarget(node.stateId);
      for (const rel of targetConnected) {
        rel.targetPos = [wx, wy, wz];
        const mesh = edgeMeshes.get(rel.relationshipId);
        if (mesh) {
          mesh.updateEndpoints(rel.sourcePos, rel.targetPos);
        }
      }
    }
  }
}
