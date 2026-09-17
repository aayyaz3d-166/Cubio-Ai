/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.6: Surface Builder Engine
 *
 * Constructs deterministic 3D surfaces (Planar, Extruded, Revolved, Lofted, Bezier).
 */

import { Curve3D, Surface3D, SurfaceType } from './types';
import { CurveBuilder } from './curveBuilder';
import { deterministicHash, generateDeterministicGeometryId } from './determinism';

export class SurfaceBuilder {
  public static createPlanarSurface(
    boundaryCurve: Curve3D,
    idPrefix = 'PLANAR'
  ): Surface3D {
    if (!boundaryCurve.closed && boundaryCurve.controlPoints.length < 3) {
      throw new Error('Planar surface requires a closed curve or at least 3 control points.');
    }

    const controlPoints = boundaryCurve.controlPoints;
    const bounds = CurveBuilder.calculateBounds(controlPoints);
    const dimX = bounds.max[0] - bounds.min[0];
    const dimY = bounds.max[1] - bounds.min[1];
    const dimZ = bounds.max[2] - bounds.min[2];
    const areaEstimate = Number((dimX * dimZ + dimX * dimY + dimY * dimZ).toFixed(4));
    const checksum = deterministicHash(JSON.stringify(['PLANAR_SURF', boundaryCurve.checksum]));

    return Object.freeze({
      id: generateDeterministicGeometryId('SRF', idPrefix, 0),
      type: 'PLANAR',
      boundaryCurves: Object.freeze([boundaryCurve.id]),
      controlPoints,
      uDegree: 1,
      vDegree: 1,
      areaEstimate,
      bounds,
      checksum,
    });
  }

  public static createExtrudedSurface(
    profileCurve: Curve3D,
    direction: readonly [number, number, number],
    distance: number,
    idPrefix = 'EXTRUDED'
  ): Surface3D {
    if (!CurveBuilder.validatePoints([direction]) || distance <= 0 || !isFinite(distance)) {
      throw new Error('Extrusion requires valid finite direction and positive distance.');
    }

    const len = Math.sqrt(direction[0] ** 2 + direction[1] ** 2 + direction[2] ** 2);
    const normDir: [number, number, number] = [
      (direction[0] / len) * distance,
      (direction[1] / len) * distance,
      (direction[2] / len) * distance,
    ];

    const surfacePoints: [number, number, number][] = [];
    for (const p of profileCurve.controlPoints) {
      surfacePoints.push([p[0], p[1], p[2]]);
      surfacePoints.push([
        Number((p[0] + normDir[0]).toFixed(4)),
        Number((p[1] + normDir[1]).toFixed(4)),
        Number((p[2] + normDir[2]).toFixed(4)),
      ]);
    }

    const controlPoints = Object.freeze(surfacePoints.map((p) => Object.freeze(p)));
    const bounds = CurveBuilder.calculateBounds(controlPoints);
    const areaEstimate = Number((profileCurve.length * distance).toFixed(4));
    const checksum = deterministicHash(JSON.stringify(['EXTRUDED_SURF', profileCurve.checksum, normDir, distance]));

    return Object.freeze({
      id: generateDeterministicGeometryId('SRF', idPrefix, 0),
      type: 'EXTRUDED',
      boundaryCurves: Object.freeze([profileCurve.id]),
      controlPoints,
      uDegree: profileCurve.degree,
      vDegree: 1,
      areaEstimate,
      bounds,
      checksum,
    });
  }

  public static createRevolvedSurface(
    profileCurve: Curve3D,
    axis: readonly [number, number, number],
    angleDeg: number,
    idPrefix = 'REVOLVED'
  ): Surface3D {
    if (!CurveBuilder.validatePoints([axis]) || angleDeg <= 0 || !isFinite(angleDeg)) {
      throw new Error('Revolution requires valid finite axis and positive angle.');
    }

    const steps = 8;
    const rad = (angleDeg * Math.PI) / 180;
    const surfacePoints: [number, number, number][] = [];

    for (let s = 0; s <= steps; s++) {
      const theta = (s / steps) * rad;
      const cosT = Math.cos(theta);
      const sinT = Math.sin(theta);

      for (const p of profileCurve.controlPoints) {
        // Rotate around Y axis for simplicity
        const rx = p[0] * cosT + p[2] * sinT;
        const ry = p[1];
        const rz = -p[0] * sinT + p[2] * cosT;
        surfacePoints.push([Number(rx.toFixed(4)), Number(ry.toFixed(4)), Number(rz.toFixed(4))]);
      }
    }

    const controlPoints = Object.freeze(surfacePoints.map((p) => Object.freeze(p)));
    const bounds = CurveBuilder.calculateBounds(controlPoints);
    const areaEstimate = Number((profileCurve.length * (angleDeg / 360) * 10).toFixed(4));
    const checksum = deterministicHash(JSON.stringify(['REVOLVED_SURF', profileCurve.checksum, axis, angleDeg]));

    return Object.freeze({
      id: generateDeterministicGeometryId('SRF', idPrefix, 0),
      type: 'REVOLVED',
      boundaryCurves: Object.freeze([profileCurve.id]),
      controlPoints,
      uDegree: profileCurve.degree,
      vDegree: 2,
      areaEstimate,
      bounds,
      checksum,
    });
  }

  public static createLoftedSurface(
    sectionCurves: readonly Curve3D[],
    idPrefix = 'LOFTED'
  ): Surface3D {
    if (!sectionCurves || sectionCurves.length < 2) {
      throw new Error('Lofting requires at least 2 profile section curves.');
    }

    const surfacePoints: [number, number, number][] = [];
    for (const crv of sectionCurves) {
      for (const p of crv.controlPoints) {
        surfacePoints.push([p[0], p[1], p[2]]);
      }
    }

    const controlPoints = Object.freeze(surfacePoints.map((p) => Object.freeze(p)));
    const bounds = CurveBuilder.calculateBounds(controlPoints);
    const areaEstimate = Number((sectionCurves.reduce((acc, c) => acc + c.length, 0) * 2).toFixed(4));
    const checksum = deterministicHash(JSON.stringify(['LOFTED_SURF', sectionCurves.map((c) => c.checksum)]));

    return Object.freeze({
      id: generateDeterministicGeometryId('SRF', idPrefix, 0),
      type: 'LOFTED',
      boundaryCurves: Object.freeze(sectionCurves.map((c) => c.id)),
      controlPoints,
      uDegree: sectionCurves[0].degree,
      vDegree: sectionCurves.length - 1,
      areaEstimate,
      bounds,
      checksum,
    });
  }
}
