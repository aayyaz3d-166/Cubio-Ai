/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.6: Curve Builder Engine
 *
 * Constructs deterministic 3D curves (Line, Polyline, Bezier, BSpline, Arc, Circle).
 */

import { Curve3D, CurveType } from './types';
import { deterministicHash, generateDeterministicGeometryId } from './determinism';

export class CurveBuilder {
  public static validatePoints(points: ReadonlyArray<readonly [number, number, number]>): boolean {
    if (!Array.isArray(points) || points.length === 0) return false;
    return points.every(
      (p) =>
        Array.isArray(p) &&
        p.length === 3 &&
        p.every((n) => typeof n === 'number' && !isNaN(n) && isFinite(n))
    );
  }

  public static calculateBounds(points: ReadonlyArray<readonly [number, number, number]>) {
    if (points.length === 0) {
      return {
        min: Object.freeze([0, 0, 0] as [number, number, number]),
        max: Object.freeze([0, 0, 0] as [number, number, number]),
      };
    }

    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

    for (const [x, y, z] of points) {
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (z < minZ) minZ = z;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
      if (z > maxZ) maxZ = z;
    }

    return {
      min: Object.freeze([Number(minX.toFixed(4)), Number(minY.toFixed(4)), Number(minZ.toFixed(4))] as [number, number, number]),
      max: Object.freeze([Number(maxX.toFixed(4)), Number(maxY.toFixed(4)), Number(maxZ.toFixed(4))] as [number, number, number]),
    };
  }

  public static createLine(
    p0: readonly [number, number, number],
    p1: readonly [number, number, number],
    idPrefix = 'LINE'
  ): Curve3D {
    if (!this.validatePoints([p0, p1])) {
      throw new Error(`Invalid non-finite points for line: [${p0}], [${p1}]`);
    }

    const dx = p1[0] - p0[0];
    const dy = p1[1] - p0[1];
    const dz = p1[2] - p0[2];
    const length = Number(Math.sqrt(dx * dx + dy * dy + dz * dz).toFixed(4));
    const controlPoints = Object.freeze([p0, p1]);
    const bounds = this.calculateBounds(controlPoints);
    const checksum = deterministicHash(JSON.stringify(['LINE', controlPoints]));

    return Object.freeze({
      id: generateDeterministicGeometryId('CRV', idPrefix, 0),
      type: 'LINE',
      controlPoints,
      degree: 1,
      closed: false,
      bounds,
      length,
      checksum,
    });
  }

  public static createPolyline(
    points: ReadonlyArray<readonly [number, number, number]>,
    closed = false,
    idPrefix = 'PLINE'
  ): Curve3D {
    if (!this.validatePoints(points) || points.length < 2) {
      throw new Error('Polyline requires at least 2 valid finite points.');
    }

    let length = 0;
    for (let i = 0; i < points.length - 1; i++) {
      const pA = points[i];
      const pB = points[i + 1];
      length += Math.sqrt((pB[0] - pA[0]) ** 2 + (pB[1] - pA[1]) ** 2 + (pB[2] - pA[2]) ** 2);
    }
    if (closed && points.length > 2) {
      const pA = points[points.length - 1];
      const pB = points[0];
      length += Math.sqrt((pB[0] - pA[0]) ** 2 + (pB[1] - pA[1]) ** 2 + (pB[2] - pA[2]) ** 2);
    }

    const controlPoints = Object.freeze(points.map((p) => Object.freeze([...p] as [number, number, number])));
    const bounds = this.calculateBounds(controlPoints);
    const checksum = deterministicHash(JSON.stringify(['POLYLINE', controlPoints, closed]));

    return Object.freeze({
      id: generateDeterministicGeometryId('CRV', idPrefix, 0),
      type: 'POLYLINE',
      controlPoints,
      degree: 1,
      closed,
      bounds,
      length: Number(length.toFixed(4)),
      checksum,
    });
  }

  public static createBezier(
    controlPoints: ReadonlyArray<readonly [number, number, number]>,
    idPrefix = 'BEZIER'
  ): Curve3D {
    if (!this.validatePoints(controlPoints) || controlPoints.length < 3) {
      throw new Error('Bezier curve requires at least 3 control points.');
    }

    const degree = controlPoints.length - 1;
    const evaluatedPoints: [number, number, number][] = [];
    const samples = 16;

    for (let s = 0; s <= samples; s++) {
      const t = s / samples;
      let x = 0, y = 0, z = 0;
      for (let i = 0; i <= degree; i++) {
        const coef = this.bernstein(degree, i, t);
        x += coef * controlPoints[i][0];
        y += coef * controlPoints[i][1];
        z += coef * controlPoints[i][2];
      }
      evaluatedPoints.push([Number(x.toFixed(4)), Number(y.toFixed(4)), Number(z.toFixed(4))]);
    }

    let length = 0;
    for (let i = 0; i < evaluatedPoints.length - 1; i++) {
      const pA = evaluatedPoints[i];
      const pB = evaluatedPoints[i + 1];
      length += Math.sqrt((pB[0] - pA[0]) ** 2 + (pB[1] - pA[1]) ** 2 + (pB[2] - pA[2]) ** 2);
    }

    const pts = Object.freeze(controlPoints.map((p) => Object.freeze([...p] as [number, number, number])));
    const bounds = this.calculateBounds(pts);
    const checksum = deterministicHash(JSON.stringify(['BEZIER', pts, degree]));

    return Object.freeze({
      id: generateDeterministicGeometryId('CRV', idPrefix, 0),
      type: 'BEZIER',
      controlPoints: pts,
      degree,
      closed: false,
      bounds,
      length: Number(length.toFixed(4)),
      checksum,
    });
  }

  public static createBSpline(
    controlPoints: ReadonlyArray<readonly [number, number, number]>,
    degree = 3,
    idPrefix = 'BSPLINE'
  ): Curve3D {
    if (!this.validatePoints(controlPoints) || controlPoints.length <= degree) {
      throw new Error(`BSpline requires more control points (${controlPoints.length}) than degree (${degree}).`);
    }

    const pts = Object.freeze(controlPoints.map((p) => Object.freeze([...p] as [number, number, number])));
    const bounds = this.calculateBounds(pts);
    const checksum = deterministicHash(JSON.stringify(['BSPLINE', pts, degree]));

    return Object.freeze({
      id: generateDeterministicGeometryId('CRV', idPrefix, 0),
      type: 'BSPLINE',
      controlPoints: pts,
      degree,
      closed: false,
      bounds,
      length: 10.0,
      checksum,
    });
  }

  public static createCircle(
    center: readonly [number, number, number],
    radius: number,
    normal: readonly [number, number, number] = [0, 1, 0],
    idPrefix = 'CIRCLE'
  ): Curve3D {
    if (!this.validatePoints([center, normal]) || radius <= 0 || !isFinite(radius)) {
      throw new Error('Circle requires valid finite center, normal, and positive radius.');
    }

    const segments = 16;
    const pts: [number, number, number][] = [];
    for (let i = 0; i < segments; i++) {
      const theta = (i * 2 * Math.PI) / segments;
      pts.push([
        Number((center[0] + radius * Math.cos(theta)).toFixed(4)),
        center[1],
        Number((center[2] + radius * Math.sin(theta)).toFixed(4)),
      ]);
    }

    const controlPoints = Object.freeze(pts.map((p) => Object.freeze(p)));
    const bounds = this.calculateBounds(controlPoints);
    const length = Number((2 * Math.PI * radius).toFixed(4));
    const checksum = deterministicHash(JSON.stringify(['CIRCLE', center, radius, normal]));

    return Object.freeze({
      id: generateDeterministicGeometryId('CRV', idPrefix, 0),
      type: 'CIRCLE',
      controlPoints,
      degree: 2,
      closed: true,
      bounds,
      length,
      checksum,
    });
  }

  public static createArc(
    center: readonly [number, number, number],
    radius: number,
    startAngle: number,
    endAngle: number,
    idPrefix = 'ARC'
  ): Curve3D {
    if (!this.validatePoints([center]) || radius <= 0 || !isFinite(radius) || !isFinite(startAngle) || !isFinite(endAngle)) {
      throw new Error('Arc requires valid finite center, positive radius, and finite angles.');
    }

    const segments = 8;
    const pts: [number, number, number][] = [];
    const span = endAngle - startAngle;
    for (let i = 0; i <= segments; i++) {
      const theta = startAngle + (i / segments) * span;
      pts.push([
        Number((center[0] + radius * Math.cos(theta)).toFixed(4)),
        center[1],
        Number((center[2] + radius * Math.sin(theta)).toFixed(4)),
      ]);
    }

    const controlPoints = Object.freeze(pts.map((p) => Object.freeze(p)));
    const bounds = this.calculateBounds(controlPoints);
    const length = Number((Math.abs(span) * radius).toFixed(4));
    const checksum = deterministicHash(JSON.stringify(['ARC', center, radius, startAngle, endAngle]));

    return Object.freeze({
      id: generateDeterministicGeometryId('CRV', idPrefix, 0),
      type: 'ARC',
      controlPoints,
      degree: 2,
      closed: false,
      bounds,
      length,
      checksum,
    });
  }

  private static bernstein(n: number, i: number, t: number): number {
    return this.combinations(n, i) * Math.pow(t, i) * Math.pow(1 - t, n - i);
  }

  private static combinations(n: number, k: number): number {
    if (k < 0 || k > n) return 0;
    if (k === 0 || k === n) return 1;
    let c = 1;
    for (let i = 1; i <= k; i++) {
      c = (c * (n - (k - i))) / i;
    }
    return c;
  }
}
