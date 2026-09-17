/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.7: P6.6 to P6.7 Bridge Adapter
 *
 * Imports P6.6 AdvancedGeometryScene into an initial ParametricFeatureGraph while preserving canonical [5,3,6].
 */

import { AdvancedGeometryScene } from '../p66/types';
import { ParametricFeature, ParametricFeatureGraph } from './types';
import { ParameterSystem } from './parameterSystem';
import { FeatureGraphController } from './featureGraph';
import { deterministicHash, generateDeterministicFeatureId } from './determinism';

export class P66BridgeAdapter {
  public static adaptP66Scene(scene: AdvancedGeometryScene): ParametricFeatureGraph {
    const features: ParametricFeature[] = [];

    scene.objects.forEach((obj, idx) => {
      const featureId = generateDeterministicFeatureId('P66_IMPORT', idx + 1);
      const bounds = obj.mesh?.bounds || { min: [0, 0, 0], max: [1, 1, 1], dimensions: [1, 1, 1] };
      const sizeX = bounds.max[0] - bounds.min[0];
      const sizeY = bounds.max[1] - bounds.min[1];
      const sizeZ = bounds.max[2] - bounds.min[2];

      const pX = ParameterSystem.createParameter(featureId, 'SizeX', 'LENGTH', sizeX > 0 ? sizeX : 1);
      const pY = ParameterSystem.createParameter(featureId, 'SizeY', 'LENGTH', sizeY > 0 ? sizeY : 1);
      const pZ = ParameterSystem.createParameter(featureId, 'SizeZ', 'LENGTH', sizeZ > 0 ? sizeZ : 1);

      const checksum = deterministicHash(JSON.stringify(['P66_BRIDGE', obj.geometryChecksum, featureId]));

      features.push(
        Object.freeze({
          id: featureId,
          name: `Parametric_${obj.name}`,
          type: obj.solid ? 'EXTRUDE' : obj.curve ? 'SKETCH' : 'POINT',
          state: 'ACTIVE',
          parameters: Object.freeze([pX, pY, pZ]),
          inputReferences: Object.freeze([obj.id]),
          parentFeatureId: null,
          dependencyIds: Object.freeze([]),
          outputGeometry: obj,
          certainty: obj.certainty,
          creationIndex: idx + 1,
          checksum,
        })
      );
    });

    return FeatureGraphController.createFeatureGraph(features, `GRAPH_P67_${scene.sceneChecksum}`);
  }

  public static adaptSceneToGraph(scene: AdvancedGeometryScene): ParametricFeatureGraph {
    return this.adaptP66Scene(scene);
  }
}
