/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.7: Parametric Feature Graph Controller
 *
 * Manages the DAG of parametric features and evaluates topological order and graph checksums.
 */

import { ParametricFeature, ParametricFeatureGraph } from './types';
import { DependencyResolver } from './dependencyResolver';
import { deterministicHash } from './determinism';

export class FeatureGraphController {
  public static createFeatureGraph(features: readonly ParametricFeature[], graphId = 'GRAPH_P67_MAIN'): ParametricFeatureGraph {
    const { executionOrder, isCyclic } = DependencyResolver.resolveExecutionOrder(features);

    const rootFeatureIds = features
      .filter((f) => f.dependencyIds.length === 0)
      .map((f) => f.id);

    const graphContent = JSON.stringify(
      features.map((f) => [f.id, f.type, f.state, f.checksum, f.parameters.map((p) => [p.id, p.value])])
    );
    const checksum = deterministicHash(graphContent);

    return Object.freeze({
      graphId,
      features: Object.freeze([...features]),
      rootFeatureIds: Object.freeze(rootFeatureIds),
      executionOrder,
      isCyclic,
      checksum,
      timestamp: 0,
    });
  }

  public static addFeature(graph: ParametricFeatureGraph, feature: ParametricFeature): ParametricFeatureGraph {
    const nextFeatures = [...graph.features, feature];
    return this.createFeatureGraph(nextFeatures, graph.graphId);
  }

  public static removeFeature(graph: ParametricFeatureGraph, featureId: string): ParametricFeatureGraph {
    const nextFeatures = graph.features.filter((f) => f.id !== featureId);
    return this.createFeatureGraph(nextFeatures, graph.graphId);
  }

  public static setFeatureState(
    graph: ParametricFeatureGraph,
    featureId: string,
    state: 'ACTIVE' | 'SUPPRESSED' | 'INVALID'
  ): ParametricFeatureGraph {
    const nextFeatures = graph.features.map((f) => (f.id === featureId ? { ...f, state } : f));
    return this.createFeatureGraph(nextFeatures, graph.graphId);
  }
}
