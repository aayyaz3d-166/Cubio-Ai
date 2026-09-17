/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.7: Parametric CSG Boolean Features
 *
 * Wraps P6.6 CSG boolean operations into parametric features while preserving explicit unsupported cases.
 */

import { ParametricFeature } from './types';
import { BooleanOperationsEngine } from '../p66/booleanOperations';
import { MeshTopologyEngine } from '../p66/meshTopology';
import { deterministicHash, generateDeterministicFeatureId } from './determinism';

export class BooleanFeatureEngine {
  public static createBooleanFeature(
    type: 'BOOLEAN_UNION' | 'BOOLEAN_DIFFERENCE' | 'BOOLEAN_INTERSECTION',
    featureA: ParametricFeature,
    featureB: ParametricFeature,
    id = generateDeterministicFeatureId(type, 0)
  ): ParametricFeature {
    if (
      !featureA.outputGeometry ||
      !featureB.outputGeometry ||
      !featureA.outputGeometry.mesh ||
      !featureB.outputGeometry.mesh
    ) {
      const checksum = deterministicHash(JSON.stringify(['FEAT_BOOL_INVALID', type, featureA.id, featureB.id]));
      return Object.freeze({
        id,
        name: `${type}_${featureA.id}_${featureB.id}`,
        type,
        state: 'INVALID',
        parameters: Object.freeze([]),
        inputReferences: Object.freeze([featureA.id, featureB.id]),
        parentFeatureId: null,
        dependencyIds: Object.freeze([featureA.id, featureB.id]),
        outputGeometry: null,
        certainty: 'EXACT',
        creationIndex: 0,
        checksum,
      });
    }

    const csgOp = type === 'BOOLEAN_UNION' ? 'UNION' : type === 'BOOLEAN_DIFFERENCE' ? 'DIFFERENCE' : 'INTERSECTION';
    const csgResult = BooleanOperationsEngine.executeBoolean(csgOp, featureA.outputGeometry.mesh, featureB.outputGeometry.mesh);

    const isSupported = csgResult.status === 'SUCCESS' && csgResult.outputMesh !== null;
    let outputGeometry: any = null;
    if (isSupported && csgResult.outputMesh) {
      const topology = MeshTopologyEngine.buildTopologyStructure(csgResult.outputMesh);
      const geometryChecksum = deterministicHash(JSON.stringify(['GEO_BOOL', csgResult.outputMesh.checksum]));
      outputGeometry = Object.freeze({
        id: generateDeterministicFeatureId('OBJ_BOOL', 0),
        name: `${type}_${featureA.name}_${featureB.name}`,
        solid: Object.freeze({
          id: generateDeterministicFeatureId('SLD_BOOL', 0),
          type: 'BOOLEAN_RESULT' as const,
          shellIds: Object.freeze([]),
          volume: 1.0,
          bounds: csgResult.outputMesh.bounds,
          checksum: csgResult.outputChecksum,
        }),
        topology,
        mesh: csgResult.outputMesh,
        certainty: 'EXACT' as const,
        color: '#6366f1',
        visible: true,
        geometryChecksum,
      });
    }

    const checksum = deterministicHash(JSON.stringify(['FEAT_BOOL', type, featureA.checksum, featureB.checksum]));

    return Object.freeze({
      id,
      name: `${type}_${featureA.name}_${featureB.name}`,
      type,
      state: isSupported ? 'ACTIVE' : 'INVALID',
      parameters: Object.freeze([]),
      inputReferences: Object.freeze([featureA.id, featureB.id]),
      parentFeatureId: null,
      dependencyIds: Object.freeze([featureA.id, featureB.id]),
      outputGeometry,
      certainty: 'EXACT',
      creationIndex: 0,
      checksum,
    });
  }
}
