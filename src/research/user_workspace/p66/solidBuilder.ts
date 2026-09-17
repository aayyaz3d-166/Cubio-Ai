/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.6: Solid Builder Engine
 *
 * Constructs deterministic 3D solids from closed profiles, extrusions, and revolutions.
 */

import { Curve3D, Surface3D, Solid3D, AdvancedMesh3D } from './types';
import { CurveBuilder } from './curveBuilder';
import { SurfaceBuilder } from './surfaceBuilder';
import { MeshTopologyEngine } from './meshTopology';
import { deterministicHash, generateDeterministicGeometryId } from './determinism';

export class SolidBuilder {
  public static createExtrudedSolid(
    profileCurve: Curve3D,
    height: number,
    idPrefix = 'EXTRUDED_SOLID'
  ): { solid: Solid3D; mesh: AdvancedMesh3D } {
    if (height <= 0 || !isFinite(height)) {
      throw new Error(`Invalid extrusion height: ${height} (must be positive and finite).`);
    }
    if (!profileCurve.closed && profileCurve.controlPoints.length < 3) {
      throw new Error('Solid extrusion requires a closed profile curve or at least 3 points.');
    }

    const n = profileCurve.controlPoints.length;
    const vertices: [number, number, number][] = [];
    const faces: [number, number, number][] = [];
    const normals: [number, number, number][] = [];

    // Bottom cap vertices (y = 0)
    for (const p of profileCurve.controlPoints) {
      vertices.push([p[0], p[1], p[2]]);
    }
    // Top cap vertices (y = height)
    for (const p of profileCurve.controlPoints) {
      vertices.push([p[0], Number((p[1] + height).toFixed(4)), p[2]]);
    }

    // Side quad-faces (two triangles per segment)
    for (let i = 0; i < n; i++) {
      const next = (i + 1) % n;
      const b0 = i;
      const b1 = next;
      const t0 = n + i;
      const t1 = n + next;

      faces.push([b0, t0, b1]);
      faces.push([b1, t0, t1]);
    }

    // Cap triangulation (fan from first vertex)
    for (let i = 1; i < n - 1; i++) {
      faces.push([0, i + 1, i]); // Bottom
      faces.push([n, n + i, n + i + 1]); // Top
    }

    for (let i = 0; i < vertices.length; i++) {
      normals.push([0, 1, 0]);
    }

    const bounds = CurveBuilder.calculateBounds(vertices);
    const dimX = bounds.max[0] - bounds.min[0];
    const dimZ = bounds.max[2] - bounds.min[2];
    const volume = Number((dimX * dimZ * height * 0.8).toFixed(4));

    const solidChecksum = deterministicHash(JSON.stringify(['EXTRUDED_SOLID', profileCurve.checksum, height]));
    const meshChecksum = deterministicHash(JSON.stringify(['EXTRUDED_SOLID_MESH', vertices, faces]));

    const solid: Solid3D = Object.freeze({
      id: generateDeterministicGeometryId('SLD', idPrefix, 0),
      type: 'EXTRUSION',
      shellIds: Object.freeze(['SHELL_001']),
      volume,
      bounds,
      checksum: solidChecksum,
    });

    const mesh: AdvancedMesh3D = Object.freeze({
      id: generateDeterministicGeometryId('MSH', idPrefix, 0),
      vertices: Object.freeze(vertices.map((v) => Object.freeze(v))),
      edges: Object.freeze([]),
      faces: Object.freeze(faces.map((f) => Object.freeze(f))),
      normals: Object.freeze(normals.map((n) => Object.freeze(n))),
      bounds: Object.freeze({
        min: bounds.min,
        max: bounds.max,
        dimensions: Object.freeze([dimX, height, dimZ]) as readonly [number, number, number],
      }),
      isManifold: true,
      isClosed: true,
      tolerance: 0.1,
      checksum: meshChecksum,
    });

    return { solid, mesh };
  }

  public static createRevolvedSolid(
    profileCurve: Curve3D,
    angleDeg = 360,
    idPrefix = 'REVOLVED_SOLID'
  ): { solid: Solid3D; mesh: AdvancedMesh3D } {
    if (angleDeg <= 0 || !isFinite(angleDeg)) {
      throw new Error(`Invalid revolution angle: ${angleDeg} (must be positive and finite).`);
    }

    const steps = 12;
    const n = profileCurve.controlPoints.length;
    const vertices: [number, number, number][] = [];
    const faces: [number, number, number][] = [];
    const rad = (angleDeg * Math.PI) / 180;

    for (let s = 0; s < steps; s++) {
      const theta = (s / steps) * rad;
      const cosT = Math.cos(theta);
      const sinT = Math.sin(theta);

      for (const p of profileCurve.controlPoints) {
        const rx = p[0] * cosT + p[2] * sinT;
        const ry = p[1];
        const rz = -p[0] * sinT + p[2] * cosT;
        vertices.push([Number(rx.toFixed(4)), Number(ry.toFixed(4)), Number(rz.toFixed(4))]);
      }
    }

    // Side faces between rings
    for (let s = 0; s < steps; s++) {
      const nextS = (s + 1) % steps;
      for (let i = 0; i < n - 1; i++) {
        const i0 = s * n + i;
        const i1 = s * n + (i + 1);
        const i2 = nextS * n + i;
        const i3 = nextS * n + (i + 1);

        faces.push([i0, i2, i1]);
        faces.push([i1, i2, i3]);
      }
    }

    const bounds = CurveBuilder.calculateBounds(vertices);
    const dimX = bounds.max[0] - bounds.min[0];
    const dimY = bounds.max[1] - bounds.min[1];
    const dimZ = bounds.max[2] - bounds.min[2];
    const volume = Number(((Math.PI / 4) * dimX * dimZ * dimY * (angleDeg / 360)).toFixed(4));

    const solidChecksum = deterministicHash(JSON.stringify(['REVOLVED_SOLID', profileCurve.checksum, angleDeg]));
    const meshChecksum = deterministicHash(JSON.stringify(['REVOLVED_SOLID_MESH', vertices.length, faces.length]));

    const solid: Solid3D = Object.freeze({
      id: generateDeterministicGeometryId('SLD', idPrefix, 0),
      type: 'REVOLUTION',
      shellIds: Object.freeze(['SHELL_001']),
      volume,
      bounds,
      checksum: solidChecksum,
    });

    const mesh: AdvancedMesh3D = Object.freeze({
      id: generateDeterministicGeometryId('MSH', idPrefix, 0),
      vertices: Object.freeze(vertices.map((v) => Object.freeze(v))),
      edges: Object.freeze([]),
      faces: Object.freeze(faces.map((f) => Object.freeze(f))),
      normals: Object.freeze(vertices.map(() => Object.freeze([0, 1, 0] as [number, number, number]))),
      bounds: Object.freeze({
        min: bounds.min,
        max: bounds.max,
        dimensions: Object.freeze([dimX, dimY, dimZ]) as readonly [number, number, number],
      }),
      isManifold: true,
      isClosed: angleDeg === 360,
      tolerance: 0.1,
      checksum: meshChecksum,
    });

    return { solid, mesh };
  }
}
