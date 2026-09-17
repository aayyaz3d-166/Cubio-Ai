/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.25-J: P6.6 Advanced Geometry Binding Layer
 *
 * Binds P6.6 points, curves, surfaces, solids, meshes, and B-Rep topologies
 * to User Workspace Spaces while preserving object IDs, coordinates, dimensions,
 * bounding boxes, checksums, and construction lineage.
 */

import {
  WorkspaceBoundGeometryObject,
  WorkspaceBoundGeometryScene,
  WorkspaceGeometryType,
} from './types';
import {
  GeometryKernel,
} from '../p66/geometryKernel';
import {
  CurveBuilder,
} from '../p66/curveBuilder';
import {
  SurfaceBuilder,
} from '../p66/surfaceBuilder';
import {
  SolidBuilder,
} from '../p66/solidBuilder';
import {
  MeshTopologyEngine,
} from '../p66/meshTopology';
import {
  BooleanOperationsEngine,
} from '../p66/booleanOperations';
import {
  AdvancedGeometryObject,
  AdvancedGeometryScene,
  AdvancedMesh3D,
  BooleanOperationResult,
} from '../p66/types';
import {
  deterministicHash,
  generateDeterministicSceneId,
  generateDeterministicGeometryObjectId,
  computeObjectChecksum,
  computeSceneChecksum,
} from './determinism';

export class GeometryBindingLayer {
  public static bindPoint(
    spaceId: string,
    ownerId: string,
    coordinate: readonly [number, number, number],
    name = 'Point Node',
    sequence = 0
  ): WorkspaceBoundGeometryObject {
    const p66Obj = GeometryKernel.createPointObject(coordinate, name);
    const objectId = generateDeterministicGeometryObjectId(spaceId, 'PT', sequence);
    const bounds = {
      min: coordinate,
      max: coordinate,
    };
    const dimensions: [number, number, number] = [0, 0, 0];
    const checksum = computeObjectChecksum({
      objectId,
      name,
      geometryType: 'POINT',
      coordinates: coordinate,
      dimensions,
      bounds,
    });

    return Object.freeze({
      objectId,
      name,
      geometryType: 'POINT',
      coordinates: coordinate,
      dimensions,
      bounds,
      p66Object: p66Obj,
      certainty: 'EXACT',
      lineageId: `LIN_${objectId}`,
      geometryChecksum: checksum,
      spaceId,
      ownerId,
      visible: true,
      color: '#38bdf8',
    });
  }

  public static bindCurve(
    spaceId: string,
    ownerId: string,
    controlPoints: ReadonlyArray<readonly [number, number, number]>,
    type: 'LINE' | 'BEZIER' = 'LINE',
    name = 'Boundary Curve',
    sequence = 0
  ): WorkspaceBoundGeometryObject {
    const curve =
      type === 'LINE'
        ? CurveBuilder.createLine(controlPoints[0], controlPoints[1])
        : CurveBuilder.createBezier(controlPoints);
    const p66Obj = GeometryKernel.createCurveObject(curve, name);
    const objectId = generateDeterministicGeometryObjectId(spaceId, 'CRV', sequence);
    const min = curve.bounds.min;
    const max = curve.bounds.max;
    const dimensions: [number, number, number] = [
      Math.abs(max[0] - min[0]),
      Math.abs(max[1] - min[1]),
      Math.abs(max[2] - min[2]),
    ];
    const checksum = computeObjectChecksum({
      objectId,
      name,
      geometryType: 'CURVE',
      coordinates: min,
      dimensions,
      bounds: { min, max },
    });

    return Object.freeze({
      objectId,
      name,
      geometryType: 'CURVE',
      coordinates: min,
      dimensions,
      bounds: { min, max },
      p66Object: p66Obj,
      certainty: 'EXACT',
      lineageId: `LIN_${objectId}`,
      geometryChecksum: checksum,
      spaceId,
      ownerId,
      visible: true,
      color: '#a855f7',
    });
  }

  public static bindSurface(
    spaceId: string,
    ownerId: string,
    origin: readonly [number, number, number],
    width = 2,
    height = 2,
    name = 'Planar Surface',
    sequence = 0
  ): WorkspaceBoundGeometryObject {
    const p0: [number, number, number] = [origin[0], origin[1], origin[2]];
    const p1: [number, number, number] = [origin[0] + width, origin[1], origin[2]];
    const p2: [number, number, number] = [origin[0] + width, origin[1] + height, origin[2]];
    const p3: [number, number, number] = [origin[0], origin[1] + height, origin[2]];

    const boundary = CurveBuilder.createPolyline([p0, p1, p2, p3], true);
    const surface = SurfaceBuilder.createPlanarSurface(boundary);
    const p66Obj = GeometryKernel.createSurfaceObject(surface, name);
    const objectId = generateDeterministicGeometryObjectId(spaceId, 'SRF', sequence);
    const min = surface.bounds.min;
    const max = surface.bounds.max;
    const dimensions: [number, number, number] = [width, height, 0];
    const checksum = computeObjectChecksum({
      objectId,
      name,
      geometryType: 'SURFACE',
      coordinates: origin,
      dimensions,
      bounds: { min, max },
    });

    return Object.freeze({
      objectId,
      name,
      geometryType: 'SURFACE',
      coordinates: origin,
      dimensions,
      bounds: { min, max },
      p66Object: p66Obj,
      certainty: 'EXACT',
      lineageId: `LIN_${objectId}`,
      geometryChecksum: checksum,
      spaceId,
      ownerId,
      visible: true,
      color: '#10b981',
    });
  }

  public static bindSolidBox(
    spaceId: string,
    ownerId: string,
    origin: readonly [number, number, number],
    dimensions: readonly [number, number, number] = [2, 2, 2],
    name = 'Solid Primitive',
    sequence = 0
  ): WorkspaceBoundGeometryObject {
    const [w, h, d] = dimensions;
    const p0: [number, number, number] = [origin[0], origin[1], origin[2]];
    const p1: [number, number, number] = [origin[0] + w, origin[1], origin[2]];
    const p2: [number, number, number] = [origin[0] + w, origin[1], origin[2] + d];
    const p3: [number, number, number] = [origin[0], origin[1], origin[2] + d];

    const baseProfile = CurveBuilder.createPolyline([p0, p1, p2, p3], true);
    const { solid, mesh } = SolidBuilder.createExtrudedSolid(baseProfile, h);
    const topology = MeshTopologyEngine.buildTopologyStructure(mesh);
    const geometryChecksum = deterministicHash(JSON.stringify(['GEO_SLD', solid.checksum, mesh.checksum]));

    const p66Obj: AdvancedGeometryObject = Object.freeze({
      id: generateDeterministicGeometryObjectId(spaceId, 'SLD', sequence),
      name,
      solid,
      topology,
      mesh,
      certainty: 'EXACT',
      color: '#f59e0b',
      visible: true,
      geometryChecksum,
    });

    const objectId = generateDeterministicGeometryObjectId(spaceId, 'SLD', sequence);
    const min: [number, number, number] = [origin[0], origin[1], origin[2]];
    const max: [number, number, number] = [origin[0] + w, origin[1] + h, origin[2] + d];
    const checksum = computeObjectChecksum({
      objectId,
      name,
      geometryType: 'SOLID',
      coordinates: origin,
      dimensions,
      bounds: { min, max },
    });

    return Object.freeze({
      objectId,
      name,
      geometryType: 'SOLID',
      coordinates: origin,
      dimensions,
      bounds: { min, max },
      p66Object: p66Obj,
      certainty: 'EXACT',
      lineageId: `LIN_${objectId}`,
      geometryChecksum: checksum,
      spaceId,
      ownerId,
      visible: true,
      color: '#f59e0b',
    });
  }

  public static bindMesh(
    spaceId: string,
    ownerId: string,
    mesh: AdvancedMesh3D,
    name = 'Mesh Geometry',
    sequence = 0
  ): WorkspaceBoundGeometryObject {
    const topology = MeshTopologyEngine.buildTopologyStructure(mesh);
    const objectId = generateDeterministicGeometryObjectId(spaceId, 'MSH', sequence);
    const min = mesh.bounds.min;
    const max = mesh.bounds.max;
    const dimensions = mesh.bounds.dimensions;
    const checksum = computeObjectChecksum({
      objectId,
      name,
      geometryType: 'MESH',
      coordinates: min,
      dimensions,
      bounds: { min, max },
    });

    const p66Obj: AdvancedGeometryObject = Object.freeze({
      id: objectId,
      name,
      topology,
      mesh,
      certainty: 'EXACT',
      color: '#06b6d4',
      visible: true,
      geometryChecksum: checksum,
    });

    return Object.freeze({
      objectId,
      name,
      geometryType: 'MESH',
      coordinates: min,
      dimensions,
      bounds: { min, max },
      p66Object: p66Obj,
      certainty: 'EXACT',
      lineageId: `LIN_${objectId}`,
      geometryChecksum: checksum,
      spaceId,
      ownerId,
      visible: true,
      color: '#06b6d4',
    });
  }

  public static createDefaultSpaceScene(
    spaceId: string,
    ownerId: string,
    initialCoordinates: readonly [number, number, number] = [5, 3, 6],
    initialDimensions: readonly [number, number, number] = [2, 2, 2]
  ): WorkspaceBoundGeometryScene {
    const sceneId = generateDeterministicSceneId(spaceId, 0);

    // 1. Primary Solid Box anchored at initialCoordinates
    const primaryBox = GeometryBindingLayer.bindSolidBox(
      spaceId,
      ownerId,
      initialCoordinates,
      initialDimensions,
      'Canonical Research Solid',
      0
    );

    // 2. Canonical Anchor Point
    const anchorPoint = GeometryBindingLayer.bindPoint(
      spaceId,
      ownerId,
      initialCoordinates,
      'Origin Anchor',
      1
    );

    const objects = Object.freeze([primaryBox, anchorPoint]);
    const sceneChecksum = computeSceneChecksum(sceneId, spaceId, objects);

    const p66Scene: AdvancedGeometryScene = Object.freeze({
      sceneId,
      sourceRealityChecksum: 'CS_REALITY_CANONICAL_01',
      sourceModelChecksum: 'CS_MODEL_CANONICAL_01',
      objects: objects.map((o) => o.p66Object),
      sceneChecksum,
      timestamp: Date.now(),
    });

    return Object.freeze({
      sceneId,
      spaceId,
      ownerId,
      objects,
      selectedObjectId: primaryBox.objectId,
      sceneChecksum,
      p66Scene,
      isFrozen: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }
}
