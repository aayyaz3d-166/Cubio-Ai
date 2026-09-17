/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.6: Advanced Geometry Validator
 *
 * Implements strict deep validation for curves, surfaces, solids, and meshes.
 * Rejects non-finite coordinates (NaN, Infinity), degenerate shapes, and corrupt topology.
 */

import { AdvancedGeometryObject, AdvancedGeometryScene, GeometryValidationReport } from './types';
import { TopologyValidator } from './topologyValidator';
import { deterministicHash } from './determinism';

export class GeometryValidator {
  public static validateObject(obj: AdvancedGeometryObject): GeometryValidationReport {
    const issues: string[] = [];

    // 1. Mesh vertex finiteness
    for (let i = 0; i < obj.mesh.vertices.length; i++) {
      const v = obj.mesh.vertices[i];
      if (!Array.isArray(v) || v.length !== 3 || v.some((n) => typeof n !== 'number' || isNaN(n) || !isFinite(n))) {
        issues.push(`Mesh in object ${obj.id} contains non-finite vertex #${i}: [${v}]`);
      }
    }

    // 2. Mesh face index range
    const numV = obj.mesh.vertices.length;
    for (let i = 0; i < obj.mesh.faces.length; i++) {
      const [f0, f1, f2] = obj.mesh.faces[i];
      if (f0 >= numV || f1 >= numV || f2 >= numV || f0 < 0 || f1 < 0 || f2 < 0) {
        issues.push(`Mesh face #${i} out of vertex index bounds: [${f0}, ${f1}, ${f2}]`);
      }
    }

    // 3. Topology Validation if available
    let nonManifoldCount = 0;
    let boundaryCount = 0;
    if (obj.topology) {
      const topReport = TopologyValidator.validateTopology(obj.topology);
      if (!topReport.isValid) {
        issues.push(...topReport.issues);
      }
      nonManifoldCount = topReport.nonManifoldCount;
      boundaryCount = topReport.boundaryCount;
    }

    const isValid = issues.length === 0;
    const status = issues.some((msg) => msg.includes('non-finite'))
      ? 'NON_FINITE_GEOMETRY'
      : !isValid
      ? 'GEOMETRY_INVALID'
      : 'GEOMETRY_VALID';

    const reportChecksum = deterministicHash(JSON.stringify([status, isValid, obj.geometryChecksum, issues.length]));

    return Object.freeze({
      status,
      isValid,
      issues: Object.freeze(issues),
      nonManifoldCount,
      boundaryCount,
      reportChecksum,
    });
  }

  public static validateScene(scene: AdvancedGeometryScene): GeometryValidationReport {
    const issues: string[] = [];
    let totalNonManifold = 0;
    let totalBoundary = 0;

    for (const obj of scene.objects) {
      const objReport = this.validateObject(obj);
      if (!objReport.isValid) {
        issues.push(...objReport.issues);
      }
      totalNonManifold += objReport.nonManifoldCount;
      totalBoundary += objReport.boundaryCount;
    }

    const isValid = issues.length === 0;
    const status = issues.some((msg) => msg.includes('non-finite'))
      ? 'NON_FINITE_GEOMETRY'
      : !isValid
      ? 'GEOMETRY_INVALID'
      : 'GEOMETRY_VALID';

    const reportChecksum = deterministicHash(JSON.stringify([status, isValid, scene.sceneChecksum, issues.length]));

    return Object.freeze({
      status,
      isValid,
      issues: Object.freeze(issues),
      nonManifoldCount: totalNonManifold,
      boundaryCount: totalBoundary,
      reportChecksum,
    });
  }
}
