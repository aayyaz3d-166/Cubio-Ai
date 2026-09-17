/**
 * 3D Memory Studio — Funnel 56
 * Simulation Scene Synchronizer Adapter
 *
 * Synchronizes F52 real-time simulation world state into the F56 scene graph.
 */

import { SimulationWorldState } from '../../funnel52/types';
import { SceneGraph } from '../scene/sceneGraph';
import { SceneRegistry } from '../scene/sceneRegistry';
import { LayerManager } from '../layers/layerManager';
import { StateSceneObject } from '../objects/stateSceneObject';
import { RelationshipSceneObject } from '../objects/relationshipSceneObject';
import { ClusterSceneObject } from '../objects/clusterSceneObject';
import { DimensionSceneObject } from '../objects/dimensionSceneObject';
import { filterAndCreateStateObjects } from './securitySceneAdapter';

export interface SceneSyncReport {
  readonly statesAdded: number;
  readonly edgesAdded: number;
  readonly clustersAdded: number;
  readonly dimensionsAdded: number;
  readonly totalObjects: number;
}

export function synchronizeSimulationWithScene(
  world: SimulationWorldState,
  graph: SceneGraph,
  registry: SceneRegistry,
  layerManager: LayerManager
): SceneSyncReport {
  // 1. Clear existing dynamic scene nodes
  graph.clear();
  registry.clear();
  layerManager.clearAll();

  // Register static core
  registry.register(graph.coreNode);
  layerManager.addObject(graph.coreNode);

  // 2. Add Dimension Object
  const dimObj = new DimensionSceneObject(world.activeDimension);
  graph.dimensionsNode.addChild(dimObj);
  registry.register(dimObj);
  layerManager.addObject(dimObj);

  // 3. Process & Filter GREEN states (strictly bounded to max 50 visible states)
  const sourceList = world.allSourceStates || (world.activeNodes ? world.activeNodes.map((n) => n.sourceState) : []);
  const boundedSourceStates = sourceList.slice(0, 50);
  const { objects: stateObjects } = filterAndCreateStateObjects(
    boundedSourceStates,
    world.activeDimension
  );

  for (const stateObj of stateObjects) {
    graph.statesNode.addChild(stateObj);
    registry.register(stateObj);
    layerManager.addObject(stateObj);
  }

  // 4. Add Clusters (strictly bounded to max 20)
  const boundedClusters = (world.clusters || []).slice(0, 20);
  for (const cluster of boundedClusters) {
    const clusterObj = new ClusterSceneObject(
      cluster.clusterId,
      cluster.label,
      [cluster.centerX, cluster.centerY, cluster.centerZ],
      cluster.radius,
      cluster.memberStateIds,
      cluster.colorHex
    );
    graph.clustersNode.addChild(clusterObj);
    registry.register(clusterObj);
    layerManager.addObject(clusterObj);
  }

  // 5. Add Relational Edges (strictly bounded to max 100)
  const boundedEdges = (world.activeEdges || []).slice(0, 100);
  for (const edge of boundedEdges) {
    const relObj = new RelationshipSceneObject(
      edge.id,
      edge.sourceNodeId,
      edge.targetNodeId,
      'SEMANTIC',
      edge.opacity
    );

    const srcNode = world.activeNodes?.find((n) => n.stateId === edge.sourceNodeId);
    const tgtNode = world.activeNodes?.find((n) => n.stateId === edge.targetNodeId);

    relObj.setEndpoints(
      srcNode ? [srcNode.x, srcNode.y, srcNode.z] : [0, 0, 0],
      tgtNode ? [tgtNode.x, tgtNode.y, tgtNode.z] : [0, 0, 0]
    );

    graph.relationshipsNode.addChild(relObj);
    registry.register(relObj);
    layerManager.addObject(relObj);
  }

  return Object.freeze({
    statesAdded: stateObjects.length,
    edgesAdded: boundedEdges.length,
    clustersAdded: boundedClusters.length,
    dimensionsAdded: 1,
    totalObjects: registry.count,
  });
}
