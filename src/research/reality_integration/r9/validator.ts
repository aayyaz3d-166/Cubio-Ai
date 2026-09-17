/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R9: Geometry Validator Engine
 *
 * Implements comprehensive epistemic and structural validation for R9 geometry sessions.
 * Rejects: NaN/Infinity, broken references, duplicate IDs, invalid scale/transforms,
 * broken lineage, unauthorized Reality mutations, and automatic OBSERVED promotions.
 */

import {
  GeometrySession,
  WorkspaceGeometry,
  GeometryValidationReport,
  GeometryValidationStatus,
} from './types';
import { R9GeometryMeshEngine } from './geometryMeshEngine';
import { R9HistoryEngine } from './history';
import { deterministicHash } from './determinism';

export class R9GeometryValidator {
  /**
   * Performs deep validation of an entire GeometrySession.
   */
  public static validateSession(
    session: GeometrySession,
    knownRealityObjectIds: readonly string[] = []
  ): GeometryValidationReport {
    const issues: string[] = [];
    let status: GeometryValidationStatus = 'GEOMETRY_VALID';

    // 1. Validate History Chain
    if (!R9HistoryEngine.validateHistoryChain(session.history)) {
      status = 'INVALID_HISTORY_CHAIN';
      issues.push('History entries have broken parent chain linkage.');
    }

    // 2. Validate Geometries
    const geoIdSet = new Set<string>();
    const realitySet = new Set(knownRealityObjectIds);

    for (const geo of Object.values(session.geometries)) {
      // Duplicate Geometry ID
      if (geoIdSet.has(geo.geometryId)) {
        status = 'DUPLICATE_GEOMETRY_ID';
        issues.push(`Duplicate geometry ID: ${geo.geometryId}`);
      }
      geoIdSet.add(geo.geometryId);

      // Epistemic Boundary: USER_CONSTRUCTED cannot be OBSERVED without upstream authority
      if (geo.identity.origin === 'OBSERVED' && !geo.realityReference) {
        status = 'AUTOMATIC_OBSERVED_PROMOTION';
        issues.push(`Geometry ${geo.geometryId} is marked OBSERVED without authoritative Reality reference.`);
      }

      // Check Transform Scale / Numbers
      const [sx, sy, sz] = geo.transform.scale;
      if (!Number.isFinite(sx) || !Number.isFinite(sy) || !Number.isFinite(sz)) {
        status = 'NAN_VALUE';
        issues.push(`Non-finite scale in transform for ${geo.geometryId}`);
      }
      if (sx === 0 || sy === 0 || sz === 0) {
        status = 'INVALID_SCALE';
        issues.push(`Zero scale detected in ${geo.geometryId}`);
      }

      // Check Dimensions
      if (geo.dimensions.width < 0 || geo.dimensions.height < 0 || geo.dimensions.depth < 0) {
        status = 'INVALID_DIMENSIONS';
        issues.push(`Negative dimensions in ${geo.geometryId}`);
      }

      // Check Mesh and Topology
      const meshVal = R9GeometryMeshEngine.validateMesh(geo.mesh);
      if (!meshVal.isValid) {
        if (meshVal.errors.some((e) => e.includes('Non-finite'))) {
          status = 'NAN_VALUE';
        } else if (meshVal.errors.some((e) => e.includes('missing vertex'))) {
          status = 'BROKEN_EDGE_REFERENCE';
        } else if (meshVal.errors.some((e) => e.includes('missing edge'))) {
          status = 'BROKEN_FACE_REFERENCE';
        } else {
          status = 'INVALID_VERTEX';
        }
        issues.push(...meshVal.errors);
      }

      // Check Reality Reference if bound
      if (geo.realityReference && knownRealityObjectIds.length > 0) {
        if (!realitySet.has(geo.realityReference.realityObjectId)) {
          status = 'MISSING_REALITY_REFERENCE';
          issues.push(`Geometry ${geo.geometryId} references non-existent reality object ${geo.realityReference.realityObjectId}`);
        }
      }

      // Check Lineage
      if (!geo.lineage.lineageId || geo.lineage.geometryId !== geo.geometryId) {
        status = 'BROKEN_LINEAGE';
        issues.push(`Lineage mismatch in ${geo.geometryId}`);
      }
    }

    const reportChecksum = `VAL_CS_${deterministicHash(`${status}_${issues.length}_${session.sessionChecksum}`)}`;

    return Object.freeze({
      status,
      isValid: issues.length === 0,
      issues: Object.freeze(issues),
      reportChecksum,
    });
  }

  /**
   * Validates a single geometry entity.
   */
  public static validateGeometry(geometry: WorkspaceGeometry): GeometryValidationReport {
    const issues: string[] = [];
    let status: GeometryValidationStatus = 'GEOMETRY_VALID';

    // Numbers check
    for (const v of geometry.mesh.vertices) {
      const [x, y, z] = v.position;
      if (Number.isNaN(x) || Number.isNaN(y) || Number.isNaN(z)) {
        status = 'NAN_VALUE';
        issues.push(`NaN detected in vertex ${v.vertexId}`);
      }
      if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) {
        if (status === 'GEOMETRY_VALID') status = 'INFINITY_VALUE';
        issues.push(`Infinity detected in vertex ${v.vertexId}`);
      }
    }

    // Scale check
    const [sx, sy, sz] = geometry.transform.scale;
    if (sx === 0 || sy === 0 || sz === 0) {
      status = 'INVALID_SCALE';
      issues.push('Zero scale detected in geometry transform.');
    }

    // Origin promotion check
    if (geometry.identity.origin === 'OBSERVED' && !geometry.realityReference) {
      status = 'AUTOMATIC_OBSERVED_PROMOTION';
      issues.push('Cannot promote user geometry to OBSERVED without authoritative reality reference.');
    }

    const meshVal = R9GeometryMeshEngine.validateMesh(geometry.mesh);
    if (!meshVal.isValid) {
      issues.push(...meshVal.errors);
      if (status === 'GEOMETRY_VALID') {
        status = meshVal.errors.some((e) => e.includes('missing'))
          ? 'BROKEN_EDGE_REFERENCE'
          : 'INVALID_VERTEX';
      }
    }

    const reportChecksum = `VAL_CS_${deterministicHash(`${status}_${issues.length}_${geometry.geometryChecksum}`)}`;

    return Object.freeze({
      status,
      isValid: issues.length === 0,
      issues: Object.freeze(issues),
      reportChecksum,
    });
  }
}
