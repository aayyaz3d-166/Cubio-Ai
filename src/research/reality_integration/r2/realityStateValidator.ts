/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R2: Reality State Validator
 *
 * Validates Reality states, transitions, coordinates, dimensions, checksums,
 * and lineage. Rejects non-finite values, corrupted states, and unauthorized mutations.
 */

import {
  RealityState,
  RealityTransition,
  RealityStateValidationReport,
  RealityTransitionValidationReport,
  RealityStateValidationStatus,
} from './types';
import {
  computeRealityStateChecksum,
  deterministicHash,
} from './determinism';

export class RealityStateValidator {
  public static validateState(state: RealityState | null | undefined): RealityStateValidationReport {
    if (!state) {
      return Object.freeze({
        status: 'INVALID_STATE_ID',
        isValid: false,
        issues: Object.freeze(['RealityState is null or undefined']),
        stateId: '',
        reportChecksum: deterministicHash('NULL_STATE'),
      });
    }

    const issues: string[] = [];

    // 1. ID check
    if (!state.stateId || !state.stateId.startsWith('RST_')) {
      issues.push(`Invalid stateId format: ${state.stateId}`);
    }

    // 2. Finite coordinates check
    const [x, y, z] = state.coordinates;
    if (
      !Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z) ||
      Number.isNaN(x) || Number.isNaN(y) || Number.isNaN(z)
    ) {
      return Object.freeze({
        status: 'NON_FINITE_COORDINATES',
        isValid: false,
        issues: Object.freeze([`Non-finite coordinates detected: [${x}, ${y}, ${z}]`]),
        stateId: state.stateId,
        reportChecksum: deterministicHash('NON_FINITE_COORDINATES'),
      });
    }

    // 3. Positive finite dimensions check
    const [w, h, d] = state.dimensions;
    if (
      !Number.isFinite(w) || !Number.isFinite(h) || !Number.isFinite(d) ||
      w <= 0 || h <= 0 || d <= 0
    ) {
      return Object.freeze({
        status: 'INVALID_DIMENSIONS',
        isValid: false,
        issues: Object.freeze([`Invalid non-positive or non-finite dimensions: [${w}, ${h}, ${d}]`]),
        stateId: state.stateId,
        reportChecksum: deterministicHash('INVALID_DIMENSIONS'),
      });
    }

    // 4. Lineage check
    if (!state.lineage || !state.lineage.lineageId || !state.lineage.rootStateId) {
      return Object.freeze({
        status: 'BROKEN_LINEAGE',
        isValid: false,
        issues: Object.freeze(['Broken or missing state lineage']),
        stateId: state.stateId,
        reportChecksum: deterministicHash('BROKEN_LINEAGE'),
      });
    }

    // 5. Checksum verification
    const expectedChecksum = computeRealityStateChecksum(
      state.stateId,
      state.version,
      state.coordinates,
      state.dimensions,
      state.certainty,
      state.origin,
      state.lineage.lineageId
    );

    if (state.checksum !== expectedChecksum) {
      return Object.freeze({
        status: 'CHECKSUM_MISMATCH',
        isValid: false,
        issues: Object.freeze([`Checksum mismatch: expected ${expectedChecksum}, got ${state.checksum}`]),
        stateId: state.stateId,
        reportChecksum: deterministicHash('CHECKSUM_MISMATCH'),
      });
    }

    const isValid = issues.length === 0;
    const status: RealityStateValidationStatus = isValid ? 'REALITY_STATE_VALID' : 'INVALID_STATE_ID';
    const reportChecksum = deterministicHash(issues.join(';') + `_${status}`);

    return Object.freeze({
      status,
      isValid,
      issues: Object.freeze(issues),
      stateId: state.stateId,
      reportChecksum,
    });
  }

  public static validateTransition(
    transition: RealityTransition,
    sourceState: RealityState | null,
    targetState: RealityState
  ): RealityTransitionValidationReport {
    const issues: string[] = [];

    if (transition.sourceStateId && (!sourceState || sourceState.stateId !== transition.sourceStateId)) {
      issues.push(`Source state mismatch: expected ${transition.sourceStateId}, got ${sourceState?.stateId}`);
    }

    if (targetState.stateId !== transition.targetStateId) {
      issues.push(`Target state mismatch: expected ${transition.targetStateId}, got ${targetState.stateId}`);
    }

    if (transition.sourceChecksum && sourceState && sourceState.checksum !== transition.sourceChecksum) {
      issues.push(`Source checksum mismatch in transition`);
    }

    if (targetState.checksum !== transition.targetChecksum) {
      issues.push(`Target checksum mismatch in transition`);
    }

    const isValid = issues.length === 0;
    const reportChecksum = deterministicHash(issues.join(';') + `_${isValid}`);

    return Object.freeze({
      isValid,
      transitionType: transition.transitionType,
      issues: Object.freeze(issues),
      reportChecksum,
    });
  }
}
