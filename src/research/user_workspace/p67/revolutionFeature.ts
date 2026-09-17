/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.7: Parametric Revolution Feature
 *
 * Evaluates parametric revolution from a sketch profile around an axis.
 */

import { Sketch2D, ParametricFeature } from './types';
import { ParameterSystem } from './parameterSystem';
import { CurveBuilder } from '../p66/curveBuilder';
import { GeometryKernel } from '../p66/geometryKernel';
import { deterministicHash, generateDeterministicFeatureId } from './determinism';

export class RevolutionFeatureEngine {
  public static createRevolutionFeature(
    sketch: Sketch2D,
    angleDeg = 360,
    id = generateDeterministicFeatureId('REVOLVE', 0)
  ): ParametricFeature {
    const angleParam = ParameterSystem.createParameter(id, 'Angle', 'ANGLE', angleDeg, 1, 360, 'deg');
    const parameters = Object.freeze([angleParam]);

    const pts: [number, number, number][] = [];
    for (const ent of sketch.entities) {
      for (const p of ent.points) {
        pts.push([p[0] + sketch.origin[0], sketch.origin[1], p[1] + sketch.origin[2]]);
      }
    }

    const poly = pts.length >= 2 ? CurveBuilder.createPolyline(pts, false) : CurveBuilder.createLine([2, 0, 0], [2, 10, 0]);
    const geoObj = GeometryKernel.createRevolvedSolidObject(poly, angleDeg, `Revolve_${sketch.id}`);
    const checksum = deterministicHash(JSON.stringify(['FEAT_REV', sketch.checksum, angleDeg]));

    return Object.freeze({
      id,
      name: `Revolve_${sketch.id}`,
      type: 'REVOLVE',
      state: 'ACTIVE',
      parameters,
      inputReferences: Object.freeze([sketch.id]),
      parentFeatureId: null,
      dependencyIds: Object.freeze([sketch.id]),
      outputGeometry: geoObj,
      certainty: 'EXACT',
      creationIndex: 0,
      checksum,
    });
  }
}
