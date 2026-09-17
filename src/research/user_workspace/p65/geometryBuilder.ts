/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.5: Canonical 3D Geometry Builder
 *
 * Constructs deterministic geometric primitives (point, cube, sphere, cylinder, mesh)
 * with stable vertex ordering, face ordering, and geometry checksums.
 */

import { PrimitiveGeometryType, GeometryMesh3D, BoundingBox3D } from './types';
import { deterministicHash } from './determinism';

export class GeometryBuilder {
  public static calculateBoundingBox(vertices: ReadonlyArray<readonly [number, number, number]>): BoundingBox3D {
    if (vertices.length === 0) {
      return {
        min: [0, 0, 0],
        max: [0, 0, 0],
        center: [0, 0, 0],
        dimensions: [0, 0, 0],
      };
    }

    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

    for (const [x, y, z] of vertices) {
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (z < minZ) minZ = z;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
      if (z > maxZ) maxZ = z;
    }

    const min: [number, number, number] = [Number(minX.toFixed(4)), Number(minY.toFixed(4)), Number(minZ.toFixed(4))];
    const max: [number, number, number] = [Number(maxX.toFixed(4)), Number(maxY.toFixed(4)), Number(maxZ.toFixed(4))];
    const center: [number, number, number] = [
      Number(((minX + maxX) / 2).toFixed(4)),
      Number(((minY + maxY) / 2).toFixed(4)),
      Number(((minZ + maxZ) / 2).toFixed(4)),
    ];
    const dimensions: [number, number, number] = [
      Number((maxX - minX).toFixed(4)),
      Number((maxY - minY).toFixed(4)),
      Number((maxZ - minZ).toFixed(4)),
    ];

    return Object.freeze({
      min: Object.freeze(min),
      max: Object.freeze(max),
      center: Object.freeze(center),
      dimensions: Object.freeze(dimensions),
    });
  }

  public static createCube(size = 2.0): GeometryMesh3D {
    const h = size / 2;
    const vertices: [number, number, number][] = [
      [-h, -h, -h], [h, -h, -h], [h, h, -h], [-h, h, -h], // Front 0,1,2,3
      [-h, -h, h],  [h, -h, h],  [h, h, h],  [-h, h, h],  // Back  4,5,6,7
    ];

    const faces: [number, number, number][] = [
      [0, 2, 1], [0, 3, 2], // Front
      [4, 5, 6], [4, 6, 7], // Back
      [0, 1, 5], [0, 5, 4], // Bottom
      [2, 3, 7], [2, 7, 6], // Top
      [0, 4, 7], [0, 7, 3], // Left
      [1, 2, 6], [1, 6, 5], // Right
    ];

    const normals: [number, number, number][] = [
      [0, 0, -1], [0, 0, 1], [0, -1, 0], [0, 1, 0], [-1, 0, 0], [1, 0, 0],
    ];

    const boundingBox = this.calculateBoundingBox(vertices);
    const geometryChecksum = deterministicHash(JSON.stringify(['CUBE', vertices, faces]));

    return Object.freeze({
      type: 'CUBE',
      vertices: Object.freeze(vertices.map((v) => Object.freeze(v))),
      faces: Object.freeze(faces.map((f) => Object.freeze(f))),
      normals: Object.freeze(normals.map((n) => Object.freeze(n))),
      boundingBox,
      geometryChecksum,
    });
  }

  public static createSphere(radius = 1.0, segments = 8): GeometryMesh3D {
    const vertices: [number, number, number][] = [];
    const faces: [number, number, number][] = [];
    const normals: [number, number, number][] = [];

    // Top pole
    vertices.push([0, radius, 0]);
    normals.push([0, 1, 0]);

    // Intermediate rings
    for (let i = 1; i < segments; i++) {
      const theta = (i * Math.PI) / segments;
      const y = radius * Math.cos(theta);
      const rRing = radius * Math.sin(theta);

      for (let j = 0; j < segments; j++) {
        const phi = (j * 2 * Math.PI) / segments;
        const x = rRing * Math.cos(phi);
        const z = rRing * Math.sin(phi);
        vertices.push([Number(x.toFixed(4)), Number(y.toFixed(4)), Number(z.toFixed(4))]);
        normals.push([Number((x / radius).toFixed(4)), Number((y / radius).toFixed(4)), Number((z / radius).toFixed(4))]);
      }
    }

    // Bottom pole
    vertices.push([0, -radius, 0]);
    normals.push([0, -1, 0]);

    // Top cap faces
    for (let j = 0; j < segments; j++) {
      const next = (j + 1) % segments;
      faces.push([0, j + 1, next + 1]);
    }

    // Intermediate quad-faces as two triangles
    for (let i = 0; i < segments - 2; i++) {
      const ring1 = 1 + i * segments;
      const ring2 = 1 + (i + 1) * segments;
      for (let j = 0; j < segments; j++) {
        const next = (j + 1) % segments;
        faces.push([ring1 + j, ring2 + j, ring1 + next]);
        faces.push([ring1 + next, ring2 + j, ring2 + next]);
      }
    }

    // Bottom cap faces
    const bottomIndex = vertices.length - 1;
    const lastRing = 1 + (segments - 2) * segments;
    for (let j = 0; j < segments; j++) {
      const next = (j + 1) % segments;
      faces.push([bottomIndex, lastRing + next, lastRing + j]);
    }

    const boundingBox = this.calculateBoundingBox(vertices);
    const geometryChecksum = deterministicHash(JSON.stringify(['SPHERE', vertices, faces]));

    return Object.freeze({
      type: 'SPHERE',
      vertices: Object.freeze(vertices.map((v) => Object.freeze(v))),
      faces: Object.freeze(faces.map((f) => Object.freeze(f))),
      normals: Object.freeze(normals.map((n) => Object.freeze(n))),
      boundingBox,
      geometryChecksum,
    });
  }

  public static createCylinder(radius = 1.0, height = 2.0, segments = 8): GeometryMesh3D {
    const vertices: [number, number, number][] = [];
    const faces: [number, number, number][] = [];
    const normals: [number, number, number][] = [];
    const h = height / 2;

    // Top circle
    for (let i = 0; i < segments; i++) {
      const phi = (i * 2 * Math.PI) / segments;
      vertices.push([Number((radius * Math.cos(phi)).toFixed(4)), h, Number((radius * Math.sin(phi)).toFixed(4))]);
      normals.push([Number(Math.cos(phi).toFixed(4)), 0, Number(Math.sin(phi).toFixed(4))]);
    }

    // Bottom circle
    for (let i = 0; i < segments; i++) {
      const phi = (i * 2 * Math.PI) / segments;
      vertices.push([Number((radius * Math.cos(phi)).toFixed(4)), -h, Number((radius * Math.sin(phi)).toFixed(4))]);
      normals.push([Number(Math.cos(phi).toFixed(4)), 0, Number(Math.sin(phi).toFixed(4))]);
    }

    // Side faces
    for (let i = 0; i < segments; i++) {
      const next = (i + 1) % segments;
      faces.push([i, segments + i, next]);
      faces.push([next, segments + i, segments + next]);
    }

    const boundingBox = this.calculateBoundingBox(vertices);
    const geometryChecksum = deterministicHash(JSON.stringify(['CYLINDER', vertices, faces]));

    return Object.freeze({
      type: 'CYLINDER',
      vertices: Object.freeze(vertices.map((v) => Object.freeze(v))),
      faces: Object.freeze(faces.map((f) => Object.freeze(f))),
      normals: Object.freeze(normals.map((n) => Object.freeze(n))),
      boundingBox,
      geometryChecksum,
    });
  }

  public static createPoint(): GeometryMesh3D {
    const vertices: [number, number, number][] = [[0, 0, 0]];
    const faces: [number, number, number][] = [];
    const normals: [number, number, number][] = [[0, 1, 0]];
    const boundingBox = this.calculateBoundingBox(vertices);
    const geometryChecksum = deterministicHash(JSON.stringify(['POINT', vertices]));

    return Object.freeze({
      type: 'POINT',
      vertices: Object.freeze(vertices.map((v) => Object.freeze(v))),
      faces: Object.freeze([]),
      normals: Object.freeze(normals.map((n) => Object.freeze(n))),
      boundingBox,
      geometryChecksum,
    });
  }
}
