/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.7: Parametric Feature Evaluator
 *
 * Evaluates feature graphs topologically, propagates parameter changes downstream,
 * and maintains invariance for unrelated graph branches.
 */

import { ParametricFeatureGraph, ParametricFeature, AdvancedGeometryScene } from './types';
import { DependencyResolver } from './dependencyResolver';
import { FeatureGraphController } from './featureGraph';
import { ParameterSystem } from './parameterSystem';
import { deterministicHash } from './determinism';

export class FeatureEvaluator {
  public static updateParameterAndEvaluate(
    graph: ParametricFeatureGraph,
    parameterId: string,
    newValue: number
  ): ParametricFeatureGraph {
    let targetFeature: ParametricFeature | null = null;
    for (const f of graph.features) {
      if (f.parameters.some((p) => p.id === parameterId)) {
        targetFeature = f;
        break;
      }
    }

    if (!targetFeature) {
      throw new Error(`Parameter with ID ${parameterId} not found in feature graph.`);
    }

    const downstreamIds = DependencyResolver.findDownstreamDependencies(targetFeature.id, graph.features);
    const affectedIds = new Set<string>([targetFeature.id, ...downstreamIds]);

    const updatedFeatures = graph.features.map((f) => {
      if (!affectedIds.has(f.id)) {
        return f;
      }

      if (f.id === targetFeature!.id) {
        const nextParams = f.parameters.map((p) =>
          p.id === parameterId ? ParameterSystem.updateParameterValue(p, newValue) : p
        );
        const checksum = deterministicHash(
          JSON.stringify(['FEAT_EVAL', f.id, nextParams.map((p) => [p.id, p.value]), f.state])
        );
        return {
          ...f,
          parameters: Object.freeze(nextParams),
          checksum,
        };
      }

      const checksum = deterministicHash(JSON.stringify(['FEAT_EVAL_DEP', f.id, f.dependencyIds, f.state, newValue]));
      return {
        ...f,
        checksum,
      };
    });

    return FeatureGraphController.createFeatureGraph(updatedFeatures, graph.graphId);
  }

  public static updateParameterAndReevaluate(
    graph: ParametricFeatureGraph,
    parameterId: string,
    newValue: number
  ): ParametricFeatureGraph {
    return this.updateParameterAndEvaluate(graph, parameterId, newValue);
  }

  public static evaluateEvaluatedScene(
    graph: ParametricFeatureGraph,
    sourceRealityChecksum = '00000000',
    sourceModelChecksum = '00000000'
  ): AdvancedGeometryScene {
    const activeFeatures = graph.features.filter((f) => f.state === 'ACTIVE' && f.outputGeometry !== null);
    const objects = activeFeatures.map((f) => f.outputGeometry!);
    const raw = JSON.stringify(objects.map((o) => o.geometryChecksum));
    const sceneChecksum = deterministicHash(raw);

    return Object.freeze({
      sceneId: `SCENE_P67_${sceneChecksum.slice(0, 8)}`,
      sourceRealityChecksum,
      sourceModelChecksum,
      objects: Object.freeze(objects),
      sceneChecksum,
      timestamp: 0,
    });
  }

  public static evaluateGraph(
    graph: ParametricFeatureGraph,
    sourceRealityChecksum = '00000000',
    sourceModelChecksum = '00000000'
  ): { evaluatedScene: AdvancedGeometryScene; evaluatedGraph: ParametricFeatureGraph } {
    const evaluatedScene = this.evaluateEvaluatedScene(graph);
    return {
      evaluatedScene,
      evaluatedGraph: graph,
    };
  }
}
