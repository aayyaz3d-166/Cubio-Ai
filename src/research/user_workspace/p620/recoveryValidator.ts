/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.20: Pre-Activation Recovery State Validator
 *
 * Enforces deep validation before any restored checkpoint or state is committed.
 */

import { RecoveryState } from './types';

export interface RecoveryValidationResult {
  readonly isValid: boolean;
  readonly issues: readonly string[];
}

export class RecoveryStateValidator {
  public static validate(state: RecoveryState): RecoveryValidationResult {
    const issues: string[] = [];

    // 1. Reality Authority Check
    if (!state.realityState || !state.realityState.isAuthoritative) {
      issues.push('Missing or non-authoritative Reality state in recovery package');
    } else {
      const [x, y, z] = state.realityState.canonicalCoordinates;
      if (x !== 5 || y !== 3 || z !== 6) {
        issues.push(`Canonical coordinate breach: [${x}, ${y}, ${z}] does not match contract [5, 3, 6]`);
      }
    }

    // 2. Geometry Integrity Check
    if (!state.geometries || state.geometries.length === 0) {
      issues.push('Missing geometry entities in recovery state');
    } else {
      state.geometries.forEach((g) => {
        if (!g.coordinates || g.coordinates.length !== 3) {
          issues.push(`Geometry ${g.geometryId} has invalid coordinate dimension`);
        } else {
          const [x, y, z] = g.coordinates;
          if (Number.isNaN(x) || Number.isNaN(y) || Number.isNaN(z)) {
            issues.push(`Geometry ${g.geometryId} contains NaN coordinate`);
          }
          if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) {
            issues.push(`Geometry ${g.geometryId} contains non-finite/Infinity coordinate`);
          }
        }
        if (!g.lineageId || g.lineageId.length < 4) {
          issues.push(`Geometry ${g.geometryId} has broken lineageId`);
        }
      });
    }

    // 3. Space Reference Integrity
    if (!state.space || !state.space.spaceId) {
      issues.push('Missing or invalid space identity in recovery state');
    }

    // 4. Saved State & Version Checks
    if (!state.savedState || !state.savedState.stateId) {
      issues.push('Missing saved state reference in recovery payload');
    }
    if (!state.version || !state.version.versionId) {
      issues.push('Missing version checkpoint reference in recovery payload');
    }

    // 5. Ambiguity & Non-Fabrication Check
    if (state.realityState && state.realityState.certainty === 'UNKNOWN') {
      issues.push('Cannot recover ambiguous or unknown Reality state without observation authority');
    }

    // 6. Privacy & Security Checks
    const serialized = JSON.stringify(state);
    if (serialized.includes('password') || serialized.includes('token') || serialized.includes('creditCard')) {
      issues.push('Forbidden private credentials or payment data detected in recovery state');
    }

    return Object.freeze({
      isValid: issues.length === 0,
      issues: Object.freeze(issues),
    });
  }
}
