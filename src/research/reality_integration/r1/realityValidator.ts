/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R1: Reality Integration Validator
 *
 * Validates Reality identity, state, coordinates, dimensions, checksums,
 * and lineage. Rejects non-finite values and unauthorized mutations.
 */

import {
  ObservableRealityState,
  ModelRepresentation,
  GeometryRepresentation,
  RealityValidationReport,
  RealityValidationStatus,
} from './types';
import {
  computeRealityChecksum,
  deterministicHash,
} from './determinism';

export class RealityValidator {
  public static validateRealityState(
    realityState: ObservableRealityState | null | undefined
  ): RealityValidationReport {
    if (!realityState) {
      return Object.freeze({
        status: 'MISSING_REALITY_STATE',
        isValid: false,
        issues: Object.freeze(['Reality state is null or undefined']),
        realityId: '',
        stateId: '',
        reportChecksum: deterministicHash('MISSING_REALITY_STATE'),
      });
    }

    const issues: string[] = [];

    // 1. Identity validation
    if (!realityState.realityIdentity || !realityState.realityIdentity.realityId) {
      issues.push('Invalid or missing RealityIdentity structure');
    }

    // 2. Coordinate finite check
    const [x, y, z] = realityState.coordinates;
    if (
      !Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z) ||
      Number.isNaN(x) || Number.isNaN(y) || Number.isNaN(z)
    ) {
      return Object.freeze({
        status: 'NON_FINITE_COORDINATES',
        isValid: false,
        issues: Object.freeze([`Non-finite coordinates detected: [${x}, ${y}, ${z}]`]),
        realityId: realityState.realityIdentity?.realityId ?? '',
        stateId: realityState.stateId,
        reportChecksum: deterministicHash('NON_FINITE_COORDINATES'),
      });
    }

    // 3. Dimension validation
    const [w, h, d] = realityState.dimensions;
    if (
      !Number.isFinite(w) || !Number.isFinite(h) || !Number.isFinite(d) ||
      w <= 0 || h <= 0 || d <= 0
    ) {
      issues.push(`Invalid non-positive or non-finite dimensions: [${w}, ${h}, ${d}]`);
    }

    // 4. Lineage validation
    if (!realityState.lineageId || realityState.lineageId.trim() === '') {
      issues.push('Broken or missing lineage ID');
    }

    // 5. Checksum verification
    const expectedChecksum = computeRealityChecksum(
      realityState.realityIdentity.realityId,
      realityState.coordinates,
      realityState.dimensions,
      realityState.certainty,
      realityState.lineageId
    );

    if (realityState.checksum !== expectedChecksum) {
      issues.push(`Reality checksum mismatch. Expected ${expectedChecksum}, got ${realityState.checksum}`);
    }

    const isValid = issues.length === 0;
    const status: RealityValidationStatus = isValid
      ? 'REALITY_VALID'
      : issues[0].includes('dimensions')
      ? 'INVALID_DIMENSIONS'
      : issues[0].includes('checksum')
      ? 'CHECKSUM_MISMATCH'
      : issues[0].includes('lineage')
      ? 'BROKEN_LINEAGE'
      : 'INVALID_IDENTITY';

    const reportChecksum = deterministicHash(issues.join(';') + `_${status}`);

    return Object.freeze({
      status,
      isValid,
      issues: Object.freeze(issues),
      realityId: realityState.realityIdentity.realityId,
      stateId: realityState.stateId,
      reportChecksum,
    });
  }

  public static validateRepresentationChain(
    realityState: ObservableRealityState,
    model: ModelRepresentation,
    geometry: GeometryRepresentation
  ): RealityValidationReport {
    const issues: string[] = [];

    if (model.sourceRealityId !== realityState.realityIdentity.realityId) {
      issues.push(`Model sourceRealityId (${model.sourceRealityId}) mismatch with Reality (${realityState.realityIdentity.realityId})`);
    }

    if (geometry.sourceRealityId !== realityState.realityIdentity.realityId) {
      issues.push(`Geometry sourceRealityId (${geometry.sourceRealityId}) mismatch with Reality (${realityState.realityIdentity.realityId})`);
    }

    if (geometry.sourceModelId !== model.modelId) {
      issues.push(`Geometry sourceModelId (${geometry.sourceModelId}) mismatch with Model (${model.modelId})`);
    }

    const isValid = issues.length === 0;
    const status: RealityValidationStatus = isValid ? 'REALITY_VALID' : 'REALITY_MODEL_MISMATCH';
    const reportChecksum = deterministicHash(issues.join(';') + `_${status}`);

    return Object.freeze({
      status,
      isValid,
      issues: Object.freeze(issues),
      realityId: realityState.realityIdentity.realityId,
      stateId: realityState.stateId,
      reportChecksum,
    });
  }
}
