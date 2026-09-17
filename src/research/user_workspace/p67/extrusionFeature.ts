/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.7: Parametric Extrusion Feature
 *
 * Evaluates parametric extrusion from a closed 2D sketch with distance and direction parameters.
 */

import { Sketch2D, ParametricFeature } from './types';
import { ParameterSystem } from './parameterSystem';
import { CurveBuilder } from '../p66/curveBuilder';
import { GeometryKernel } from '../p66/geometryKernel';
import { deterministicHash, generateDeterministicFeatureId } from './determinism';

export class ExtrusionFeatureEngine {
  public static createExtrusionFeature(
    sketch: Sketch2D,
    distance = 10,
    symmetric = false,
    id = generateDeterministicFeatureId('EXTRUDE', 0)
  ): ParametricFeature {
    const distParam = ParameterSystem.createParameter(id, 'Distance', 'LENGTH', distance, 0.1, 500, 'mm');
    const symParam = ParameterSystem.createParameter(id, 'Symmetric', 'BOOLEAN', symmetric ? 1 : 0, 0, 1, '');

    const parameters = Object.freeze([distParam, symParam]);

    for (const ent of sketch.entities) {
      if (ent.type === 'CIRCLE') {
        const circle = CurveBuilder.createCircle([sketch.origin[0], sketch.origin[1], sketch.origin[2]], ent.radius || 3);
        const geoObj = GeometryKernel.createExtrudedSolidObject(circle, distance, `Extrude_${sketch.id}`);

        const checksum = deterministicHash(JSON.stringify(['FEAT_EXT', sketch.checksum, distance, symmetric]));
        return Object.freeze({
          id,
          name: `Extrude_${sketch.id}`,
          type: 'EXTRUDE',
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

    const pts: [number, number, number][] = [];
    for (const ent of sketch.entities) {
      for (const p of ent.points) {
        pts.push([p[0] + sketch.origin[0], sketch.origin[1], p[1] + sketch.origin[2]]);
      }
    }

    const poly = CurveBuilder.createPolyline(pts, true);
    const geoObj = GeometryKernel.createExtrudedSolidObject(poly, distance, `Extrude_${sketch.id}`);
    const checksum = deterministicHash(JSON.stringify(['FEAT_EXT', sketch.checksum, distance, symmetric]));

    return Object.freeze({
      id,
      name: `Extrude_${sketch.id}`,
      type: 'EXTRUDE',
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
