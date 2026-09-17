/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.6: Deterministic Geometry Kernel
 *
 * Provides a unified procedural interface for curves, surfaces, solids, booleans, and transforms.
 */

import {
  Curve3D,
  Surface3D,
  Solid3D,
  AdvancedMesh3D,
  AdvancedGeometryObject,
  AdvancedGeometryScene,
} from './types';
import { CurveBuilder } from './curveBuilder';
import { SurfaceBuilder } from './surfaceBuilder';
import { SolidBuilder } from './solidBuilder';
import { MeshTopologyEngine } from './meshTopology';
import { BooleanOperationsEngine } from './booleanOperations';
import { deterministicHash, generateDeterministicGeometryId } from './determinism';

export class GeometryKernel {
  public static createPointObject(coordinate: readonly [number, number, number], name = 'Point'): AdvancedGeometryObject {
    if (!CurveBuilder.validatePoints([coordinate])) {
      throw new Error(`Invalid non-finite point coordinate: [${coordinate}]`);
    }

    const pointId = generateDeterministicGeometryId('PT', 'NODE', 0);
    const checksum = deterministicHash(JSON.stringify(['POINT', coordinate]));

    const mesh: AdvancedMesh3D = Object.freeze({
      id: generateDeterministicGeometryId('MSH', 'PT', 0),
      vertices: Object.freeze([coordinate]),
      edges: Object.freeze([]),
      faces: Object.freeze([]),
      normals: Object.freeze([[0, 1, 0]] as (readonly [number, number, number])[]),
      bounds: Object.freeze({
        min: coordinate,
        max: coordinate,
        dimensions: Object.freeze([0, 0, 0]) as readonly [number, number, number],
      }),
      isManifold: true,
      isClosed: false,
      tolerance: 0.1,
      checksum,
    });

    return Object.freeze({
      id: pointId,
      name,
      point: Object.freeze({ id: pointId, coordinate, checksum }),
      mesh,
      certainty: 'EXACT',
      color: '#38bdf8',
      visible: true,
      geometryChecksum: checksum,
    });
  }

  public static createCurveObject(curve: Curve3D, name = 'Curve'): AdvancedGeometryObject {
    const mesh = MeshTopologyEngine.tessellateCurveToMesh(curve);
    const topology = MeshTopologyEngine.buildTopologyStructure(mesh);
    const geometryChecksum = deterministicHash(JSON.stringify(['GEO_CRV', curve.checksum, mesh.checksum]));

    return Object.freeze({
      id: generateDeterministicGeometryId('OBJ', 'CRV', 0),
      name,
      curve,
      topology,
      mesh,
      certainty: 'EXACT',
      color: '#a855f7',
      visible: true,
      geometryChecksum,
    });
  }

  public static createSurfaceObject(surface: Surface3D, name = 'Surface'): AdvancedGeometryObject {
    const mesh = MeshTopologyEngine.tessellateSurfaceToMesh(surface);
    const topology = MeshTopologyEngine.buildTopologyStructure(mesh);
    const geometryChecksum = deterministicHash(JSON.stringify(['GEO_SRF', surface.checksum, mesh.checksum]));

    return Object.freeze({
      id: generateDeterministicGeometryId('OBJ', 'SRF', 0),
      name,
      surface,
      topology,
      mesh,
      certainty: 'EXACT',
      color: '#10b981',
      visible: true,
      geometryChecksum,
    });
  }

  public static createExtrudedSolidObject(profile: Curve3D, height: number, name = 'Extruded Solid'): AdvancedGeometryObject {
    const { solid, mesh } = SolidBuilder.createExtrudedSolid(profile, height);
    const topology = MeshTopologyEngine.buildTopologyStructure(mesh);
    const geometryChecksum = deterministicHash(JSON.stringify(['GEO_SLD', solid.checksum, mesh.checksum]));

    return Object.freeze({
      id: generateDeterministicGeometryId('OBJ', 'SLD_EXT', 0),
      name,
      solid,
      topology,
      mesh,
      certainty: 'EXACT',
      color: '#f59e0b',
      visible: true,
      geometryChecksum,
    });
  }

  public static createRevolvedSolidObject(profile: Curve3D, angle = 360, name = 'Revolved Solid'): AdvancedGeometryObject {
    const { solid, mesh } = SolidBuilder.createRevolvedSolid(profile, angle);
    const topology = MeshTopologyEngine.buildTopologyStructure(mesh);
    const geometryChecksum = deterministicHash(JSON.stringify(['GEO_SLD', solid.checksum, mesh.checksum]));

    return Object.freeze({
      id: generateDeterministicGeometryId('OBJ', 'SLD_REV', 0),
      name,
      solid,
      topology,
      mesh,
      certainty: 'EXACT',
      color: '#ec4899',
      visible: true,
      geometryChecksum,
    });
  }

  public static transformObject(
    obj: AdvancedGeometryObject,
    translation: readonly [number, number, number],
    rotation: readonly [number, number, number],
    scale: readonly [number, number, number]
  ): AdvancedGeometryObject {
    if (!CurveBuilder.validatePoints([translation, rotation, scale])) {
      throw new Error('Transform parameters must be valid finite numbers.');
    }

    const transformedVertices: [number, number, number][] = obj.mesh.vertices.map(([x, y, z]) => {
      const sx = x * scale[0];
      const sy = y * scale[1];
      const sz = z * scale[2];
      return [
        Number((sx + translation[0]).toFixed(4)),
        Number((sy + translation[1]).toFixed(4)),
        Number((sz + translation[2]).toFixed(4)),
      ];
    });

    const meshBounds = CurveBuilder.calculateBounds(transformedVertices);
    const dimX = meshBounds.max[0] - meshBounds.min[0];
    const dimY = meshBounds.max[1] - meshBounds.min[1];
    const dimZ = meshBounds.max[2] - meshBounds.min[2];

    const updatedMesh: AdvancedMesh3D = Object.freeze({
      ...obj.mesh,
      vertices: Object.freeze(transformedVertices.map((v) => Object.freeze(v))),
      bounds: Object.freeze({
        min: meshBounds.min,
        max: meshBounds.max,
        dimensions: Object.freeze([dimX, dimY, dimZ]) as readonly [number, number, number],
      }),
      checksum: deterministicHash(JSON.stringify(['TR_MESH', transformedVertices, obj.mesh.faces])),
    });

    const updatedTopology = obj.topology ? MeshTopologyEngine.buildTopologyStructure(updatedMesh) : undefined;
    const geometryChecksum = deterministicHash(JSON.stringify(['TR_GEO', updatedMesh.checksum, translation, scale]));

    return Object.freeze({
      ...obj,
      mesh: updatedMesh,
      topology: updatedTopology,
      geometryChecksum,
    });
  }

  public static buildScene(
    sourceRealityChecksum: string,
    sourceModelChecksum: string,
    objects: readonly AdvancedGeometryObject[]
  ): AdvancedGeometryScene {
    const sceneHashContent = JSON.stringify(objects.map((o) => [o.id, o.geometryChecksum, o.visible]));
    const sceneChecksum = deterministicHash(JSON.stringify([sourceRealityChecksum, sourceModelChecksum, sceneHashContent]));

    return Object.freeze({
      sceneId: `P66_SCENE_${sceneChecksum.slice(0, 8)}`,
      sourceRealityChecksum,
      sourceModelChecksum,
      objects: Object.freeze([...objects]),
      sceneChecksum,
      timestamp: 0,
    });
  }
}
