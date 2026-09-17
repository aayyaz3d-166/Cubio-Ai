/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.7: Parametric Feature Validator
 *
 * Validates DAG acyclicity, parameter boundaries, and flags unsupported feature cases.
 */

import { ParametricFeatureGraph, FeatureValidationReport } from './types';
import { deterministicHash } from './determinism';

export class FeatureValidator {
  public static validateGraph(graph: ParametricFeatureGraph): FeatureValidationReport {
    const issues: string[] = [];

    if (graph.isCyclic) {
      issues.push('Detected cyclic feature dependency in feature graph.');
      return Object.freeze({
        isValid: false,
        status: 'CYCLIC_FEATURE_DEPENDENCY',
        issues: Object.freeze(issues),
        reportChecksum: deterministicHash(JSON.stringify(['CYCLIC', graph.graphId])),
      });
    }

    for (const f of graph.features) {
      if (f.state === 'INVALID') {
        if (f.type === 'FILLET') {
          issues.push(`Unsupported fillet case in feature ${f.id}`);
        } else if (f.type === 'CHAMFER') {
          issues.push(`Unsupported chamfer case in feature ${f.id}`);
        } else if (f.type.startsWith('BOOLEAN')) {
          issues.push(`Unsupported boolean case in feature ${f.id}`);
        } else {
          issues.push(`Invalid feature state in ${f.id}`);
        }
      }

      for (const p of f.parameters) {
        if (isNaN(p.value) || !isFinite(p.value) || p.value < p.min || p.value > p.max) {
          issues.push(`Parameter ${p.name} in feature ${f.id} is invalid: ${p.value}`);
        }
      }
    }

    const isValid = issues.length === 0;
    const status = !isValid
      ? issues.some((m) => m.includes('fillet'))
        ? 'UNSUPPORTED_FILLET_CASE'
        : issues.some((m) => m.includes('chamfer'))
        ? 'UNSUPPORTED_CHAMFER_CASE'
        : issues.some((m) => m.includes('boolean'))
        ? 'UNSUPPORTED_BOOLEAN_CASE'
        : 'INVALID_PARAMETER'
      : 'VALID';

    const reportChecksum = deterministicHash(JSON.stringify([status, isValid, graph.checksum, issues.length]));

    return Object.freeze({
      isValid,
      status,
      issues: Object.freeze(issues),
      reportChecksum,
    });
  }
}
