/**
 * 3D Memory Studio — Funnel 57
 * Security Geometry Adapter & F47 GREEN/RED Gate
 *
 * Strictly authorizes only GREEN states to receive 3D geometry and materials.
 * RED records are 100% blocked from receiving meshes.
 */

import { StateSceneObject } from '../../funnel56/objects/stateSceneObject';
import { StateMesh } from '../objects/stateMesh';
import { GeometryFactory } from '../geometry/geometryFactory';
import { MaterialFactory } from '../materials/materialFactory';

export interface GeometrySecurityReport {
  readonly greenMeshesCreated: number;
  readonly redMeshesBlocked: number;
  readonly totalEvaluated: number;
}

export function createSecureStateMesh(
  stateObj: StateSceneObject,
  geometryFactory: GeometryFactory,
  materialFactory: MaterialFactory,
  lod: 'LOD_HIGH' | 'LOD_MED' | 'LOD_LOW' = 'LOD_MED'
): StateMesh | null {
  if (stateObj.classification === 'GREEN') {
    return new StateMesh(stateObj, geometryFactory, materialFactory, lod);
  }
  // Strictly blocked
  return null;
}
