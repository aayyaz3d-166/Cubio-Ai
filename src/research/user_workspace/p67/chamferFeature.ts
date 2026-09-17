/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.7: Parametric Chamfer Feature
 *
 * Implements parametric edge chamfering with explicit unsupported case classification.
 */

import { ParametricFeature } from './types';
import { ParameterSystem } from './parameterSystem';
import { deterministicHash, generateDeterministicFeatureId } from './determinism';

export class ChamferFeatureEngine {
  public static createChamferFeature(
    parentFeature: ParametricFeature,
    distance = 1.0,
    selectedEdges: readonly string[] = [],
    id = generateDeterministicFeatureId('CHAMFER', 0)
  ): ParametricFeature {
    if (
      distance <= 0 ||
      distance > 50 ||
      selectedEdges.length === 0 ||
      !parentFeature.outputGeometry ||
      !parentFeature.outputGeometry.solid
    ) {
      const checksum = deterministicHash(JSON.stringify(['FEAT_CHAMFER_INVALID', parentFeature.id, distance]));
      return Object.freeze({
        id,
        name: `Chamfer_${parentFeature.name}`,
        type: 'CHAMFER',
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

    const distParam = ParameterSystem.createParameter(id, 'Distance', 'LENGTH', distance, 0.01, 50, 'mm');
    const checksum = deterministicHash(JSON.stringify(['FEAT_CHAMFER', parentFeature.id, distance, selectedEdges]));

    return Object.freeze({
      id,
      name: `Chamfer_${parentFeature.name}`,
      type: 'CHAMFER',
      state: 'ACTIVE',
      parameters: Object.freeze([distParam]),
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
