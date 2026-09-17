/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R9: Measurement Engine
 *
 * Implements downstream geometric measurements (distance, length, angle, area, volume, centroid, bounding box).
 * Epistemic Boundary: All measurements are DERIVED_FROM_GEOMETRY and never mutate Reality.
 * ΔReality = 0.
 */

import {
  WorkspaceGeometry,
  Measurement,
  MeasurementType,
  GeometryProvenance,
  BoundingBox,
} from './types';
import {
  generateDeterministicMeasurementId,
  deterministicHash,
} from './determinism';

export class R9MeasurementEngine {
  /**
   * Measures Euclidean distance between two 3D positions.
   */
  public static measureDistance(
    sessionId: string,
    posA: readonly [number, number, number],
    posB: readonly [number, number, number],
    sourceGeoIds: readonly string[],
    seq: number = 0
  ): Measurement {
    const dx = posA[0] - posB[0];
    const dy = posA[1] - posB[1];
    const dz = posA[2] - posB[2];
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

    const measurementId = generateDeterministicMeasurementId(sessionId, seq);
    const checksum = `MEAS_CS_${deterministicHash(`${distance}_${sourceGeoIds.join('_')}`)}`;

    const provenance: GeometryProvenance = Object.freeze({
      actorId: 'USER',
      reason: 'MEASURE_DISTANCE',
      sourceDomain: 'MEASUREMENT',
      timestamp: 0,
    });

    return Object.freeze({
      measurementId,
      measurementType: 'DISTANCE',
      value: distance,
      unit: 'm',
      sourceGeometryIds: Object.freeze([...sourceGeoIds]),
      origin: 'DERIVED_FROM_GEOMETRY',
      provenance,
      measurementChecksum: checksum,
    });
  }

  /**
   * Measures length of an edge or curve in geometry.
   */
  public static measureEdgeLength(
    sessionId: string,
    geometry: WorkspaceGeometry,
    edgeId: string,
    seq: number = 0
  ): Measurement {
    const edge = geometry.mesh.edges.find((e) => e.edgeId === edgeId);
    if (!edge) {
      return this.createZeroMeasurement(sessionId, 'LENGTH', [geometry.geometryId], seq);
    }

    const vA = geometry.mesh.vertices.find((v) => v.vertexId === edge.vertexA);
    const vB = geometry.mesh.vertices.find((v) => v.vertexId === edge.vertexB);
    if (!vA || !vB) {
      return this.createZeroMeasurement(sessionId, 'LENGTH', [geometry.geometryId], seq);
    }

    return this.measureDistance(sessionId, vA.position, vB.position, [geometry.geometryId], seq);
  }

  /**
   * Measures angle in degrees between three vertex points (A-B-C with B as vertex).
   */
  public static measureAngle(
    sessionId: string,
    posA: readonly [number, number, number],
    posB: readonly [number, number, number],
    posC: readonly [number, number, number],
    sourceGeoIds: readonly string[],
    seq: number = 0
  ): Measurement {
    const vBA = [posA[0] - posB[0], posA[1] - posB[1], posA[2] - posB[2]];
    const vBC = [posC[0] - posB[0], posC[1] - posB[1], posC[2] - posB[2]];

    const dot = vBA[0] * vBC[0] + vBA[1] * vBC[1] + vBA[2] * vBC[2];
    const magBA = Math.sqrt(vBA[0] * vBA[0] + vBA[1] * vBA[1] + vBA[2] * vBA[2]);
    const magBC = Math.sqrt(vBC[0] * vBC[0] + vBC[1] * vBC[1] + vBC[2] * vBC[2]);

    let angleDeg = 0;
    if (magBA > 1e-9 && magBC > 1e-9) {
      const cosVal = Math.max(-1, Math.min(1, dot / (magBA * magBC)));
      angleDeg = (Math.acos(cosVal) * 180) / Math.PI;
    }

    const measurementId = generateDeterministicMeasurementId(sessionId, seq);
    const checksum = `MEAS_CS_${deterministicHash(`${angleDeg}_${sourceGeoIds.join('_')}`)}`;

    return Object.freeze({
      measurementId,
      measurementType: 'ANGLE',
      value: angleDeg,
      unit: 'deg',
      sourceGeometryIds: Object.freeze([...sourceGeoIds]),
      origin: 'DERIVED_FROM_GEOMETRY',
      provenance: Object.freeze({
        actorId: 'USER',
        reason: 'MEASURE_ANGLE',
        sourceDomain: 'MEASUREMENT',
        timestamp: 0,
      }),
      measurementChecksum: checksum,
    });
  }

  /**
   * Measures approximate surface area of a geometry mesh.
   */
  public static measureSurfaceArea(
    sessionId: string,
    geometry: WorkspaceGeometry,
    seq: number = 0
  ): Measurement {
    let totalArea = 0;
    const vMap = new Map<string, readonly [number, number, number]>();
    geometry.mesh.vertices.forEach((v) => vMap.set(v.vertexId, v.position));

    for (const face of geometry.mesh.faces) {
      if (face.vertexIds.length >= 3) {
        const p0 = vMap.get(face.vertexIds[0]) ?? [0, 0, 0];
        const p1 = vMap.get(face.vertexIds[1]) ?? [0, 0, 0];
        const p2 = vMap.get(face.vertexIds[2]) ?? [0, 0, 0];

        const ax = p1[0] - p0[0], ay = p1[1] - p0[1], az = p1[2] - p0[2];
        const bx = p2[0] - p0[0], by = p2[1] - p0[1], bz = p2[2] - p0[2];

        const cx = ay * bz - az * by;
        const cy = az * bx - ax * bz;
        const cz = ax * by - ay * bx;

        totalArea += 0.5 * Math.sqrt(cx * cx + cy * cy + cz * cz);
      }
    }

    const measurementId = generateDeterministicMeasurementId(sessionId, seq);
    const checksum = `MEAS_CS_${deterministicHash(`${totalArea}_${geometry.geometryId}`)}`;

    return Object.freeze({
      measurementId,
      measurementType: 'AREA',
      value: totalArea,
      unit: 'm2',
      sourceGeometryIds: Object.freeze([geometry.geometryId]),
      origin: 'DERIVED_FROM_GEOMETRY',
      provenance: Object.freeze({
        actorId: 'USER',
        reason: 'MEASURE_AREA',
        sourceDomain: 'MEASUREMENT',
        timestamp: 0,
      }),
      measurementChecksum: checksum,
    });
  }

  /**
   * Measures approximate volume from bounding box.
   */
  public static measureVolume(
    sessionId: string,
    geometry: WorkspaceGeometry,
    seq: number = 0
  ): Measurement {
    const [sx, sy, sz] = geometry.mesh.boundingBox.size;
    const volume = sx * sy * sz;

    const measurementId = generateDeterministicMeasurementId(sessionId, seq);
    const checksum = `MEAS_CS_${deterministicHash(`${volume}_${geometry.geometryId}`)}`;

    return Object.freeze({
      measurementId,
      measurementType: 'VOLUME',
      value: volume,
      unit: 'm3',
      sourceGeometryIds: Object.freeze([geometry.geometryId]),
      origin: 'DERIVED_FROM_GEOMETRY',
      provenance: Object.freeze({
        actorId: 'USER',
        reason: 'MEASURE_VOLUME',
        sourceDomain: 'MEASUREMENT',
        timestamp: 0,
      }),
      measurementChecksum: checksum,
    });
  }

  /**
   * Computes centroid of the geometry mesh.
   */
  public static computeCentroid(geometry: WorkspaceGeometry): readonly [number, number, number] {
    return geometry.mesh.boundingBox.center;
  }

  private static createZeroMeasurement(
    sessionId: string,
    type: MeasurementType,
    sourceGeoIds: readonly string[],
    seq: number
  ): Measurement {
    const measurementId = generateDeterministicMeasurementId(sessionId, seq);
    return Object.freeze({
      measurementId,
      measurementType: type,
      value: 0,
      unit: 'm',
      sourceGeometryIds: Object.freeze([...sourceGeoIds]),
      origin: 'DERIVED_FROM_GEOMETRY',
      provenance: Object.freeze({
        actorId: 'USER',
        reason: `MEASURE_ZERO_${type}`,
        sourceDomain: 'MEASUREMENT',
        timestamp: 0,
      }),
      measurementChecksum: `MEAS_CS_${deterministicHash(`0_${sourceGeoIds.join('_')}`)}`,
    });
  }
}
