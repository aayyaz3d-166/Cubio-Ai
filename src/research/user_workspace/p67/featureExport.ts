/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.7: Parametric Feature Export Engine
 *
 * Implements OBJ, STL, JSON, and META exports with validation gating.
 */

import { ParametricFeatureGraph, AdvancedGeometryScene } from './types';
import { GeometryExportEngine, P66ExportBundle } from '../p66/geometryExport';
import { FeatureValidator } from './featureValidator';
import { deterministicHash } from './determinism';

export interface ParametricExportBundle {
  readonly classification: 'RESEARCH_EXPORT_READY' | 'RESEARCH_EXPORT_BLOCKED';
  readonly objContent: string | null;
  readonly stlContent: string | null;
  readonly metaJson: string;
  readonly filename: string;
  readonly checksum: string;
}

export class FeatureExportEngine {
  public static exportToObj(scene: AdvancedGeometryScene, graph: ParametricFeatureGraph): P66ExportBundle {
    const report = FeatureValidator.validateGraph(graph);
    if (!report.isValid) {
      return Object.freeze({
        format: 'OBJ_MESH' as const,
        filename: `${scene.sceneId}.obj`,
        content: `# EXPORT BLOCKED: ${report.issues.join('; ')}`,
        checksum: '00000000',
        classification: 'RESEARCH_EXPORT_BLOCKED' as const,
        validationIssues: report.issues,
      });
    }

    return GeometryExportEngine.exportToObj(scene);
  }

  public static exportToStl(scene: AdvancedGeometryScene, graph: ParametricFeatureGraph): P66ExportBundle {
    const report = FeatureValidator.validateGraph(graph);
    if (!report.isValid) {
      return Object.freeze({
        format: 'STL_MESH' as const,
        filename: `${scene.sceneId}.stl`,
        content: `solid ${scene.sceneId}\nendsolid ${scene.sceneId}`,
        checksum: '00000000',
        classification: 'RESEARCH_EXPORT_BLOCKED' as const,
        validationIssues: report.issues,
      });
    }

    return GeometryExportEngine.exportToStl(scene);
  }

  public static exportFeatureScene(
    graph: ParametricFeatureGraph,
    evaluatedScene: AdvancedGeometryScene
  ): ParametricExportBundle {
    const report = FeatureValidator.validateGraph(graph);

    if (!report.isValid) {
      return Object.freeze({
        classification: 'RESEARCH_EXPORT_BLOCKED',
        objContent: null,
        stlContent: null,
        metaJson: JSON.stringify({ status: 'BLOCKED', reason: report.status, issues: report.issues }, null, 2),
        filename: `BLOCKED_${graph.graphId}`,
        checksum: deterministicHash(JSON.stringify(['BLOCKED', graph.graphId])),
      });
    }

    const objBundle = GeometryExportEngine.exportToObj(evaluatedScene);
    const stlBundle = GeometryExportEngine.exportToStl(evaluatedScene);

    const metaJson = JSON.stringify(
      {
        status: 'READY',
        graphId: graph.graphId,
        graphChecksum: graph.checksum,
        featuresCount: graph.features.length,
        executionOrder: graph.executionOrder,
        sceneChecksum: evaluatedScene.sceneChecksum,
      },
      null,
      2
    );

    const checksum = deterministicHash(JSON.stringify(['EXPORT', graph.checksum, evaluatedScene.sceneChecksum]));

    return Object.freeze({
      classification: 'RESEARCH_EXPORT_READY',
      objContent: objBundle.content,
      stlContent: stlBundle.content,
      metaJson,
      filename: `${objBundle.filename}`,
      checksum,
    });
  }
}
