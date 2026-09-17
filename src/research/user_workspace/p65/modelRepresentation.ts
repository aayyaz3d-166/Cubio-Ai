/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.5: Model Representation Engine
 *
 * Converts Reality X objects into canonical ModelObject3D instances with deterministic transforms.
 */

import { WorkspaceObject, WorkspaceReality } from '../p61/types';
import { ModelObject3D, ModelScene3D, PrimitiveGeometryType } from './types';
import { GeometryBuilder } from './geometryBuilder';
import { deterministicHash, generateDeterministicModelId } from './determinism';

export class ModelRepresentationEngine {
  public static createModelObject(
    obj: WorkspaceObject,
    index: number,
    geoOverride?: PrimitiveGeometryType
  ): ModelObject3D {
    const geoType: PrimitiveGeometryType = geoOverride || 'SPHERE';
    const geometry =
      geoType === 'CUBE'
        ? GeometryBuilder.createCube(obj.radius ? obj.radius / 4 : 2.0)
        : geoType === 'CYLINDER'
        ? GeometryBuilder.createCylinder(obj.radius ? obj.radius / 8 : 1.0, 3.0)
        : geoType === 'POINT'
        ? GeometryBuilder.createPoint()
        : GeometryBuilder.createSphere(obj.radius ? obj.radius / 6 : 1.2);

    return Object.freeze({
      modelObjectId: generateDeterministicModelId(obj.id, index),
      sourceRealityObjectId: obj.id,
      name: obj.label,
      transform: Object.freeze({
        position: Object.freeze([obj.position[0], obj.position[1], obj.position[2]]) as readonly [number, number, number],
        rotation: Object.freeze([0, 0, 0]) as readonly [number, number, number],
        scale: Object.freeze([1.0, 1.0, 1.0]) as readonly [number, number, number],
      }),
      geometry,
      category: obj.category,
      color: obj.color,
      visible: true,
      parentId: null,
      childrenIds: Object.freeze([]),
      creationLineage: `DERIVED_FROM_REALITY_${obj.id}`,
      mutationCount: 0,
      metadata: Object.freeze({ ...obj.metadata }),
      reconstructionCertainty: 'EXACT',
    });
  }

  public static buildSceneFromReality(
    reality: WorkspaceReality,
    geometryMap?: Record<string, PrimitiveGeometryType>
  ): ModelScene3D {
    const modelObjects = reality.objects.map((obj, idx) =>
      this.createModelObject(obj, idx, geometryMap?.[obj.id])
    );

    const totalVertices = modelObjects.reduce((acc, o) => acc + o.geometry.vertices.length, 0);
    const totalFaces = modelObjects.reduce((acc, o) => acc + o.geometry.faces.length, 0);

    const modelHashContent = JSON.stringify(
      modelObjects.map((o) => [
        o.modelObjectId,
        o.sourceRealityObjectId,
        o.transform.position,
        o.transform.rotation,
        o.transform.scale,
        o.geometry.geometryChecksum,
      ])
    );
    const modelChecksum = deterministicHash(modelHashContent);

    const sceneHashContent = JSON.stringify([reality.realityChecksum, modelChecksum, modelObjects.length]);
    const sceneChecksum = deterministicHash(sceneHashContent);

    return Object.freeze({
      sceneId: `SCENE_P65_${reality.realityChecksum.slice(0, 8)}`,
      sourceRealityChecksum: reality.realityChecksum,
      objects: Object.freeze(modelObjects),
      rootObjectIds: Object.freeze(modelObjects.map((o) => o.modelObjectId)),
      sceneChecksum,
      modelChecksum,
      timestamp: 0,
      totalVertices,
      totalFaces,
    });
  }
}
