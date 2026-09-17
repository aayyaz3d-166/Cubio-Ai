/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R9: Geometry Primitive Engine
 *
 * Deterministic construction of BOX, SPHERE, CYLINDER, CONE, TORUS, PLANE.
 * All primitives are USER_CONSTRUCTED unless explicitly sourced otherwise.
 */

import {
  GeometryPrimitiveType, GeometryVertex, GeometryEdge, GeometryFace,
  GeometryMesh, GeometryTopology, GeometryTransform, GeometryDimensions,
  BoundingBox, GeometryOrigin, GeometryCertainty, GeometryProvenance,
  RealityGeometryReference, WorkspaceGeometry, GeometryIdentity, GeometryLineage,
} from './types';
import {
  generateDeterministicGeometryId, generateDeterministicMeshId,
  generateDeterministicVertexId, generateDeterministicEdgeId, generateDeterministicFaceId,
  generateDeterministicLineageId, computeVertexChecksum, computeEdgeChecksum,
  computeFaceChecksum, computeMeshChecksum, computeTopologyChecksum,
  computeTransformChecksum, computeGeometryChecksum, deterministicHash,
} from './determinism';

export class R9GeometryPrimitiveEngine {
  public static readonly IDENTITY_TRANSFORM: GeometryTransform = Object.freeze({
    translation: Object.freeze([0, 0, 0]) as readonly [number, number, number],
    rotation: Object.freeze([0, 0, 0]) as readonly [number, number, number],
    scale: Object.freeze([1, 1, 1]) as readonly [number, number, number],
    transformChecksum: computeTransformChecksum([0, 0, 0], [0, 0, 0], [1, 1, 1]),
  });

  public static createPrimitive(
    sessionId: string,
    type: GeometryPrimitiveType,
    dimensions: GeometryDimensions,
    transform: GeometryTransform | undefined,
    workspaceObjectId: string,
    realityRef: RealityGeometryReference | null,
    origin: GeometryOrigin = 'USER_CONSTRUCTED',
    certainty: GeometryCertainty = 'EXACT',
    name: string = `${type}_primitive`,
    seq = 0
  ): WorkspaceGeometry {
    const geometryId = generateDeterministicGeometryId(sessionId, type, seq);
    const xform = transform ?? R9GeometryPrimitiveEngine.IDENTITY_TRANSFORM;
    const mesh = R9GeometryPrimitiveEngine.generatePrimitiveMesh(geometryId, type, dimensions, seq);

    const identity: GeometryIdentity = Object.freeze({
      geometryId, name, geometryType: type, origin, certainty, createdSequence: seq,
    });

    const provenance: GeometryProvenance = Object.freeze({
      actorId: 'USER', reason: `CREATE_${type}`, sourceDomain: 'GEOMETRY' as const, timestamp: 0,
    });

    const lineage: GeometryLineage = Object.freeze({
      lineageId: generateDeterministicLineageId(sessionId, geometryId),
      realityStateId: realityRef?.realityStateId ?? '',
      workspaceObjectId,
      visualObjectId: '',
      interactionSessionId: sessionId,
      geometryId,
      parentGeometryId: null,
      operationId: null,
      derivedFrom: null,
      version: 0,
    });

    const geometryChecksum = computeGeometryChecksum(geometryId, mesh.meshChecksum, xform.transformChecksum);

    return Object.freeze({
      geometryId, identity, mesh, transform: xform, dimensions,
      realityReference: realityRef, workspaceObjectId, provenance, lineage, geometryChecksum,
    });
  }

  public static createBox(sessionId: string, w: number, h: number, d: number, wsObjId: string, realityRef: RealityGeometryReference | null = null, seq = 0): WorkspaceGeometry {
    return R9GeometryPrimitiveEngine.createPrimitive(sessionId, 'BOX', { width: w, height: h, depth: d }, undefined, wsObjId, realityRef, 'USER_CONSTRUCTED', 'EXACT', 'Box', seq);
  }

  public static createSphere(sessionId: string, radius: number, segments: number, wsObjId: string, realityRef: RealityGeometryReference | null = null, seq = 0): WorkspaceGeometry {
    return R9GeometryPrimitiveEngine.createPrimitive(sessionId, 'SPHERE', { width: radius * 2, height: radius * 2, depth: radius * 2, radius, segments }, undefined, wsObjId, realityRef, 'USER_CONSTRUCTED', 'EXACT', 'Sphere', seq);
  }

  public static createCylinder(sessionId: string, radius: number, height: number, segments: number, wsObjId: string, realityRef: RealityGeometryReference | null = null, seq = 0): WorkspaceGeometry {
    return R9GeometryPrimitiveEngine.createPrimitive(sessionId, 'CYLINDER', { width: radius * 2, height, depth: radius * 2, radius, segments }, undefined, wsObjId, realityRef, 'USER_CONSTRUCTED', 'EXACT', 'Cylinder', seq);
  }

  public static createCone(sessionId: string, radius: number, height: number, segments: number, wsObjId: string, realityRef: RealityGeometryReference | null = null, seq = 0): WorkspaceGeometry {
    return R9GeometryPrimitiveEngine.createPrimitive(sessionId, 'CONE', { width: radius * 2, height, depth: radius * 2, radius, segments }, undefined, wsObjId, realityRef, 'USER_CONSTRUCTED', 'EXACT', 'Cone', seq);
  }

  public static createTorus(sessionId: string, radius: number, innerRadius: number, segments: number, wsObjId: string, realityRef: RealityGeometryReference | null = null, seq = 0): WorkspaceGeometry {
    return R9GeometryPrimitiveEngine.createPrimitive(sessionId, 'TORUS', { width: radius * 2, height: innerRadius * 2, depth: radius * 2, radius, innerRadius, segments }, undefined, wsObjId, realityRef, 'USER_CONSTRUCTED', 'EXACT', 'Torus', seq);
  }

  public static createPlane(sessionId: string, w: number, d: number, wsObjId: string, realityRef: RealityGeometryReference | null = null, seq = 0): WorkspaceGeometry {
    return R9GeometryPrimitiveEngine.createPrimitive(sessionId, 'PLANE', { width: w, height: 0, depth: d }, undefined, wsObjId, realityRef, 'USER_CONSTRUCTED', 'EXACT', 'Plane', seq);
  }

  private static generatePrimitiveMesh(
    geometryId: string, type: GeometryPrimitiveType, dims: GeometryDimensions, seq: number
  ): GeometryMesh {
    const meshId = generateDeterministicMeshId(geometryId, seq);

    // Generate representative vertices for the primitive type
    const rawVerts: [number, number, number][] = R9GeometryPrimitiveEngine.primitiveVertices(type, dims);
    const vertices: GeometryVertex[] = rawVerts.map((pos, i) => Object.freeze({
      vertexId: generateDeterministicVertexId(meshId, i),
      position: Object.freeze(pos) as readonly [number, number, number],
      vertexChecksum: computeVertexChecksum(pos),
    }));

    const edges: GeometryEdge[] = [];
    for (let i = 0; i < vertices.length; i++) {
      const j = (i + 1) % vertices.length;
      edges.push(Object.freeze({
        edgeId: generateDeterministicEdgeId(meshId, i),
        vertexA: vertices[i].vertexId,
        vertexB: vertices[j].vertexId,
        edgeChecksum: computeEdgeChecksum(vertices[i].vertexId, vertices[j].vertexId),
      }));
    }

    const faceVertexIds = vertices.map((v) => v.vertexId);
    const faceEdgeIds = edges.map((e) => e.edgeId);
    const normal: [number, number, number] = [0, 1, 0];
    const faces: GeometryFace[] = [
      Object.freeze({
        faceId: generateDeterministicFaceId(meshId, 0),
        vertexIds: Object.freeze(faceVertexIds),
        edgeIds: Object.freeze(faceEdgeIds),
        normal: Object.freeze(normal) as readonly [number, number, number],
        faceChecksum: computeFaceChecksum(faceVertexIds, normal),
      }),
    ];

    const topology: GeometryTopology = Object.freeze({
      vertexCount: vertices.length,
      edgeCount: edges.length,
      faceCount: faces.length,
      isManifold: true,
      hasBoundary: type === 'PLANE',
      connectedComponents: 1,
      topologyChecksum: computeTopologyChecksum(vertices.length, edges.length, faces.length, true),
    });

    const vertexData = vertices.map((v) => `${v.vertexId}_${v.position[0]}_${v.position[1]}_${v.position[2]}`).join('__');
    const bbox = R9GeometryPrimitiveEngine.computeBBox(vertices);

    return Object.freeze({
      meshId,
      vertices: Object.freeze(vertices),
      edges: Object.freeze(edges),
      faces: Object.freeze(faces),
      topology,
      boundingBox: bbox,
      meshChecksum: computeMeshChecksum(vertices.length, edges.length, faces.length, vertexData),
    });
  }

  private static primitiveVertices(type: GeometryPrimitiveType, dims: GeometryDimensions): [number, number, number][] {
    const hw = dims.width / 2, hh = dims.height / 2, hd = dims.depth / 2;
    switch (type) {
      case 'BOX': return [
        [-hw, -hh, -hd], [hw, -hh, -hd], [hw, hh, -hd], [-hw, hh, -hd],
        [-hw, -hh, hd], [hw, -hh, hd], [hw, hh, hd], [-hw, hh, hd],
      ];
      case 'PLANE': return [[-hw, 0, -hd], [hw, 0, -hd], [hw, 0, hd], [-hw, 0, hd]];
      case 'SPHERE': {
        const r = dims.radius ?? 1;
        return [[0, r, 0], [r, 0, 0], [0, 0, r], [-r, 0, 0], [0, 0, -r], [0, -r, 0]];
      }
      case 'CYLINDER': {
        const cr = dims.radius ?? 1;
        return [[cr, hh, 0], [0, hh, cr], [-cr, hh, 0], [0, hh, -cr], [cr, -hh, 0], [0, -hh, cr], [-cr, -hh, 0], [0, -hh, -cr]];
      }
      case 'CONE': {
        const conR = dims.radius ?? 1;
        return [[0, hh, 0], [conR, -hh, 0], [0, -hh, conR], [-conR, -hh, 0], [0, -hh, -conR]];
      }
      case 'TORUS': {
        const R = dims.radius ?? 2, r2 = dims.innerRadius ?? 0.5;
        return [[R + r2, 0, 0], [R, r2, 0], [R - r2, 0, 0], [R, -r2, 0], [-(R + r2), 0, 0], [-R, r2, 0]];
      }
      default: return [[0, 0, 0]];
    }
  }

  private static computeBBox(vertices: GeometryVertex[]): BoundingBox {
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
    for (const v of vertices) {
      const [x, y, z] = v.position;
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
      if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
    }
    return Object.freeze({
      min: Object.freeze([minX, minY, minZ]) as readonly [number, number, number],
      max: Object.freeze([maxX, maxY, maxZ]) as readonly [number, number, number],
      center: Object.freeze([(minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2]) as readonly [number, number, number],
      size: Object.freeze([maxX - minX, maxY - minY, maxZ - minZ]) as readonly [number, number, number],
    });
  }
}
