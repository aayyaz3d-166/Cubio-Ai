/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.7: Parametric Feature Builder Facade
 *
 * Provides factory methods for creating Point, Sketch, Extrude, Revolve, Fillet, Chamfer, and Boolean features.
 */

import { ParametricFeature, ParametricFeatureGraph, Sketch2D } from './types';
import { ParameterSystem } from './parameterSystem';
import { ExtrusionFeatureEngine } from './extrusionFeature';
import { RevolutionFeatureEngine } from './revolutionFeature';
import { FilletFeatureEngine } from './filletFeature';
import { ChamferFeatureEngine } from './chamferFeature';
import { BooleanFeatureEngine } from './booleanFeature';
import { FeatureGraphController } from './featureGraph';
import { GeometryKernel } from '../p66/geometryKernel';
import { deterministicHash, generateDeterministicFeatureId } from './determinism';

export class FeatureBuilder {
  public static createPointFeature(
    position: readonly [number, number, number],
    id = generateDeterministicFeatureId('PT', 1)
  ): ParametricFeature {
    const px = ParameterSystem.createParameter(id, 'X', 'LENGTH', position[0], -1000, 1000);
    const py = ParameterSystem.createParameter(id, 'Y', 'LENGTH', position[1], -1000, 1000);
    const pz = ParameterSystem.createParameter(id, 'Z', 'LENGTH', position[2], -1000, 1000);

    const geoObj = GeometryKernel.createPointObject([position[0], position[1], position[2]], `Point_${id}`);
    const checksum = deterministicHash(JSON.stringify(['FEAT_PT', position]));

    return Object.freeze({
      id,
      name: `Point_${id}`,
      type: 'POINT',
      state: 'ACTIVE',
      parameters: Object.freeze([px, py, pz]),
      inputReferences: Object.freeze([]),
      parentFeatureId: null,
      dependencyIds: Object.freeze([]),
      outputGeometry: geoObj,
      certainty: 'EXACT',
      creationIndex: 1,
      checksum,
    });
  }

  public static createExtrusion(
    arg1: ParametricFeatureGraph | Sketch2D,
    arg2?: Sketch2D | number,
    arg3?: number | boolean,
    arg4?: boolean | string
  ): any {
    if ('graphId' in arg1) {
      const graph = arg1 as ParametricFeatureGraph;
      const sketch = arg2 as Sketch2D;
      const distance = typeof arg3 === 'number' ? arg3 : 10;
      const symmetric = typeof arg4 === 'boolean' ? arg4 : false;
      const featureId = generateDeterministicFeatureId('EXTRUDE', graph.features.length + 1);
      const feature = ExtrusionFeatureEngine.createExtrusionFeature(sketch, distance, symmetric, featureId);
      return FeatureGraphController.addFeature(graph, feature);
    } else {
      const sketch = arg1 as Sketch2D;
      const distance = typeof arg2 === 'number' ? arg2 : 10;
      const symmetric = typeof arg3 === 'boolean' ? arg3 : false;
      const id = typeof arg4 === 'string' ? arg4 : undefined;
      return ExtrusionFeatureEngine.createExtrusionFeature(sketch, distance, symmetric, id);
    }
  }

  public static createRevolution(
    arg1: ParametricFeatureGraph | Sketch2D,
    arg2?: Sketch2D | number,
    arg3?: number | string,
    arg4?: string
  ): any {
    if ('graphId' in arg1) {
      const graph = arg1 as ParametricFeatureGraph;
      const sketch = arg2 as Sketch2D;
      const angle = typeof arg3 === 'number' ? arg3 : 360;
      const featureId = generateDeterministicFeatureId('REVOLVE', graph.features.length + 1);
      const feature = RevolutionFeatureEngine.createRevolutionFeature(sketch, angle, featureId);
      return FeatureGraphController.addFeature(graph, feature);
    } else {
      const sketch = arg1 as Sketch2D;
      const angle = typeof arg2 === 'number' ? arg2 : 360;
      const id = typeof arg3 === 'string' ? arg3 : undefined;
      return RevolutionFeatureEngine.createRevolutionFeature(sketch, angle, id);
    }
  }

  public static createFillet(
    arg1: ParametricFeatureGraph | ParametricFeature,
    arg2?: ParametricFeature | number,
    arg3?: number | string[],
    arg4?: string[] | string
  ): any {
    if ('graphId' in arg1) {
      const graph = arg1 as ParametricFeatureGraph;
      const parent = arg2 as ParametricFeature;
      const radius = typeof arg3 === 'number' ? arg3 : 1.0;
      const edges = Array.isArray(arg4) ? arg4 : [];
      const featureId = generateDeterministicFeatureId('FILLET', graph.features.length + 1);
      const feature = FilletFeatureEngine.createFilletFeature(parent, radius, edges, featureId);
      return FeatureGraphController.addFeature(graph, feature);
    } else {
      const parent = arg1 as ParametricFeature;
      const radius = typeof arg2 === 'number' ? arg2 : 1.0;
      const edges = Array.isArray(arg3) ? arg3 : [];
      const id = typeof arg4 === 'string' ? arg4 : undefined;
      return FilletFeatureEngine.createFilletFeature(parent, radius, edges, id);
    }
  }

  public static createChamfer(
    arg1: ParametricFeatureGraph | ParametricFeature,
    arg2?: ParametricFeature | number,
    arg3?: number | string[],
    arg4?: string[] | string
  ): any {
    if ('graphId' in arg1) {
      const graph = arg1 as ParametricFeatureGraph;
      const parent = arg2 as ParametricFeature;
      const distance = typeof arg3 === 'number' ? arg3 : 1.0;
      const edges = Array.isArray(arg4) ? arg4 : [];
      const featureId = generateDeterministicFeatureId('CHAMFER', graph.features.length + 1);
      const feature = ChamferFeatureEngine.createChamferFeature(parent, distance, edges, featureId);
      return FeatureGraphController.addFeature(graph, feature);
    } else {
      const parent = arg1 as ParametricFeature;
      const distance = typeof arg2 === 'number' ? arg2 : 1.0;
      const edges = Array.isArray(arg3) ? arg3 : [];
      const id = typeof arg4 === 'string' ? arg4 : undefined;
      return ChamferFeatureEngine.createChamferFeature(parent, distance, edges, id);
    }
  }

  public static createBoolean(
    type: 'BOOLEAN_UNION' | 'BOOLEAN_DIFFERENCE' | 'BOOLEAN_INTERSECTION',
    featA: ParametricFeature,
    featB: ParametricFeature,
    id?: string
  ): ParametricFeature {
    return BooleanFeatureEngine.createBooleanFeature(type, featA, featB, id);
  }
}
