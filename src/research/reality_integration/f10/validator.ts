/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel F10: Spatial Plan Safety & Boundary Validator
 *
 * Enforces authority boundaries:
 * 1. AI cannot modify Reality.
 * 2. AI cannot promote geometry to OBSERVED.
 * 3. Rejects NaN / Infinity / Ambiguous / Unsupported operations.
 */

import { SpatialCommandPlan, F10ValidationReport, F10ValidationStatus } from './types';
import { deterministicHash } from './determinism';

export class F10Validator {
  public static validatePlan(plan: SpatialCommandPlan): F10ValidationReport {
    const issues: string[] = [...plan.validationIssues];
    let status: F10ValidationStatus = 'VALID';

    // 1. Unknown Intent
    if (plan.intent === 'UNKNOWN') {
      issues.push(`Intent cannot be UNKNOWN.`);
      status = 'UNKNOWN_INTENT';
    }

    // 2. Reality Mutation Invariant
    if (plan.realityMutation !== false) {
      issues.push(`CRITICAL VIOLATION: Spatial plan attempted to set realityMutation = true.`);
      status = 'REALITY_AUTHORITY_VIOLATION';
    }

    // 3. Ambiguous Target Resolution
    for (const ref of plan.resolvedReferences) {
      if (ref.resolutionMethod === 'AMBIGUOUS') {
        issues.push(`Ambiguous target reference: ${ref.resolutionDetails}`);
        if (status === 'VALID') status = 'AMBIGUOUS_TARGET';
      }
    }

    // 4. Validate Operation Parameters
    for (const op of plan.operations) {
      // Epistemic Origin Check (AI can NEVER produce OBSERVED reality)
      if (op.resultingOrigin === 'OBSERVED') {
        issues.push(`CRITICAL VIOLATION: AI command attempted to produce OBSERVED geometry.`);
        status = 'UNAUTHORIZED_ORIGIN_PROMOTION';
      }

      // Domain Check (AI must not operate in OBSERVED_REALITY)
      if (op.domain === 'OBSERVED_REALITY') {
        issues.push(`CRITICAL VIOLATION: AI command domain must not be OBSERVED_REALITY.`);
        status = 'REALITY_AUTHORITY_VIOLATION';
      }

      // Non-finite transform checks
      if (op.parameters.deltaTranslation) {
        for (const v of op.parameters.deltaTranslation) {
          if (!Number.isFinite(v)) {
            issues.push(`Non-finite translation parameter: ${v}`);
            status = 'NON_FINITE_VALUE';
          }
        }
      }

      if (op.parameters.factorScale) {
        for (const s of op.parameters.factorScale) {
          if (!Number.isFinite(s) || s <= 0) {
            issues.push(`Invalid scale factor: ${s}`);
            status = 'INVALID_PARAMETER';
          }
        }
      }
    }

    const isValid = issues.length === 0;
    const reportChecksum = `CS_VAL_${deterministicHash(plan.planId + status + isValid)}`;

    return {
      status,
      isValid,
      issues,
      reportChecksum,
    };
  }
}
