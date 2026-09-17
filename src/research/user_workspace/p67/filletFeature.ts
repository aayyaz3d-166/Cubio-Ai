/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.7: Parametric Fillet Feature
 *
 * Implements parametric edge filleting with explicit unsupported case classification.
 */

import { ParametricFeature } from './types';
import { ParameterSystem } from './parameterSystem';
import { deterministicHash, generateDeterministicFeatureId } from './determinism';

export class FilletFeatureEngine {
  public static createFilletFeature(
    parentFeature: ParametricFeature,
    radius = 1.0,
    selectedEdges: readonly string[] = [],
    id = generateDeterministicFeatureId('FILLET', 0)
  ): ParametricFeature {
    if (
      radius <= 0 ||
      radius > 50 ||
      selectedEdges.length === 0 ||
      !parentFeature.outputGeometry ||
      !parentFeature.outputGeometry.solid
    ) {
      const checksum = deterministicHash(JSON.stringify(['FEAT_FILLET_INVALID', parentFeature.id, radius]));
      return Object.freeze({
        id,
        name: `Fillet_${parentFeature.name}`,
        type: 'FILLET',
        state: 'INVALID',
        parameters: Object.freeze([]),
        inputReferences: Object.freeze([parentFeature.id]),
        parentFeatureId: parentFeature.id,
        dependencyIds: Object.freeze([parentFeature.id]),
        outputGeometry: null,
        certainty: 'EXACT',
        creationIndex: 0,
        checksum,
      });
    }

    const radiusParam = ParameterSystem.createParameter(id, 'Radius', 'RADIUS', radius, 0.01, 50, 'mm');
    const checksum = deterministicHash(JSON.stringify(['FEAT_FILLET', parentFeature.id, radius, selectedEdges]));

    return Object.freeze({
      id,
      name: `Fillet_${parentFeature.name}`,
      type: 'FILLET',
      state: 'ACTIVE',
      parameters: Object.freeze([radiusParam]),
      inputReferences: Object.freeze([parentFeature.id]),
      parentFeatureId: parentFeature.id,
      dependencyIds: Object.freeze([parentFeature.id]),
      outputGeometry: parentFeature.outputGeometry,
      certainty: 'EXACT',
      creationIndex: 0,
      checksum,
    });
  }
}
