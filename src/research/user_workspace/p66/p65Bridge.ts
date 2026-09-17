/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.6: P6.5 Reality Model Bridge Adapter
 *
 * Consumes P6.5 ModelScene3D instances and builds corresponding AdvancedGeometryScene representations.
 * Preserves exact canonical coordinates [5, 3, 6] without drift or unit conversion.
 */

import { ModelScene3D, ModelObject3D } from '../p65/types';
import { AdvancedGeometryObject, AdvancedGeometryScene, AdvancedMesh3D } from './types';
import { MeshTopologyEngine } from './meshTopology';
import { deterministicHash, generateDeterministicGeometryId } from './determinism';

export class P65BridgeAdapter {
  public static adaptModelObjectToGeometry(obj: ModelObject3D): AdvancedGeometryObject {
    const [px, py, pz] = obj.transform.position;
    const [sx, sy, sz] = obj.transform.scale;

    const transformedVertices: [number, number, number][] = obj.geometry.vertices.map(([vx, vy, vz]) => [
      Number((vx * sx + px).toFixed(4)),
      Number((vy * sy + py).toFixed(4)),
      Number((vz * sz + pz).toFixed(4)),
    ]);

    const transformedNormals: [number, number, number][] = obj.geometry.normals.map(([nx, ny, nz]) => [
      Number(nx.toFixed(4)),
      Number(ny.toFixed(4)),
      Number(nz.toFixed(4)),
    ]);

    const faces: [number, number, number][] = obj.geometry.faces.map(([f0, f1, f2]) => [f0, f1, f2]);

    const minX = obj.geometry.boundingBox.min[0] * sx + px;
    const minY = obj.geometry.boundingBox.min[1] * sy + py;
    const minZ = obj.geometry.boundingBox.min[2] * sz + pz;
    const maxX = obj.geometry.boundingBox.max[0] * sx + px;
    const maxY = obj.geometry.boundingBox.max[1] * sy + py;
    const maxZ = obj.geometry.boundingBox.max[2] * sz + pz;

    const meshChecksum = deterministicHash(JSON.stringify(['P65_ADAPTED_MESH', transformedVertices, faces]));

    const mesh: AdvancedMesh3D = Object.freeze({
      id: generateDeterministicGeometryId('MSH', obj.modelObjectId, 0),
      vertices: Object.freeze(transformedVertices.map((v) => Object.freeze(v))),
      edges: Object.freeze([]),
      faces: Object.freeze(faces.map((f) => Object.freeze(f))),
      normals: Object.freeze(transformedNormals.map((n) => Object.freeze(n))),
      bounds: Object.freeze({
        min: Object.freeze([Number(minX.toFixed(4)), Number(minY.toFixed(4)), Number(minZ.toFixed(4))]) as readonly [number, number, number],
        max: Object.freeze([Number(maxX.toFixed(4)), Number(maxY.toFixed(4)), Number(maxZ.toFixed(4))]) as readonly [number, number, number],
        dimensions: Object.freeze([
          Number((maxX - minX).toFixed(4)),
          Number((maxY - minY).toFixed(4)),
          Number((maxZ - minZ).toFixed(4)),
        ]) as readonly [number, number, number],
      }),
      isManifold: true,
      isClosed: obj.geometry.type === 'CUBE' || obj.geometry.type === 'SPHERE',
      tolerance: 0.1,
      checksum: meshChecksum,
    });

    const topology = MeshTopologyEngine.buildTopologyStructure(mesh);
    const geometryChecksum = deterministicHash(JSON.stringify(['GEO_P66', obj.modelObjectId, meshChecksum]));

    return Object.freeze({
      id: generateDeterministicGeometryId('OBJ', obj.modelObjectId, 0),
      name: `Geo_${obj.name}`,
      sourceModelObjectId: obj.modelObjectId,
      topology,
      mesh,
      certainty: obj.reconstructionCertainty,
      color: obj.color,
      visible: obj.visible,
      geometryChecksum,
    });
  }

  public static adaptScene(modelScene: ModelScene3D): AdvancedGeometryScene {
    const objects = modelScene.objects.map((o) => this.adaptModelObjectToGeometry(o));
    const sceneHashContent = JSON.stringify(objects.map((o) => [o.id, o.geometryChecksum, o.visible]));
    const sceneChecksum = deterministicHash(
      JSON.stringify([modelScene.sourceRealityChecksum, modelScene.modelChecksum, sceneHashContent])
    );

    return Object.freeze({
      sceneId: `P66_SCENE_${sceneChecksum.slice(0, 8)}`,
      sourceRealityChecksum: modelScene.sourceRealityChecksum,
      sourceModelChecksum: modelScene.modelChecksum,
      objects: Object.freeze(objects),
      sceneChecksum,
      timestamp: 0,
    });
  }
}
