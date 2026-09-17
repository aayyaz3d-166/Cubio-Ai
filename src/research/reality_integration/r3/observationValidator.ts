/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R3: Observation & Timeline Validator
 *
 * Validates observation records, coordinates, dimensions, checksums,
 * provenance, and temporal integrity.
 */

import {
  RealityObservationRecord,
  RealityTimeline,
  RealityObservationValidationReport,
  RealityTimelineValidationReport,
  ObservationValidationStatus,
} from './types';
import {
  computeObservationChecksum,
  deterministicHash,
} from './determinism';

export class ObservationValidator {
  public static validateObservation(
    obs: RealityObservationRecord | null | undefined
  ): RealityObservationValidationReport {
    if (!obs) {
      return Object.freeze({
        status: 'INVALID_OBSERVATION_ID',
        isValid: false,
        issues: Object.freeze(['Observation record is null or undefined']),
        observationId: '',
        reportChecksum: deterministicHash('NULL_OBSERVATION'),
      });
    }

    const issues: string[] = [];

    // 1. Identity check
    if (!obs.identity || !obs.identity.observationId || !obs.identity.targetRealityStateId) {
      issues.push('Invalid or missing observation identity');
    }

    // 2. Coordinates finite check if present
    if (obs.coordinates) {
      const [x, y, z] = obs.coordinates;
      if (
        !Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z) ||
        Number.isNaN(x) || Number.isNaN(y) || Number.isNaN(z)
      ) {
        return Object.freeze({
          status: 'NON_FINITE_COORDINATES',
          isValid: false,
          issues: Object.freeze([`Non-finite coordinates in observation: [${x}, ${y}, ${z}]`]),
          observationId: obs.identity.observationId,
          reportChecksum: deterministicHash('NON_FINITE_COORDINATES'),
        });
      }
    }

    // 3. Positive dimensions check if present
    if (obs.dimensions) {
      const [w, h, d] = obs.dimensions;
      if (
        !Number.isFinite(w) || !Number.isFinite(h) || !Number.isFinite(d) ||
        w <= 0 || h <= 0 || d <= 0
      ) {
        return Object.freeze({
          status: 'INVALID_DIMENSIONS',
          isValid: false,
          issues: Object.freeze([`Invalid non-positive dimensions: [${w}, ${h}, ${d}]`]),
          observationId: obs.identity.observationId,
          reportChecksum: deterministicHash('INVALID_DIMENSIONS'),
        });
      }
    }

    // 4. Lineage check
    if (!obs.lineage || !obs.lineage.lineageId || !obs.lineage.rootObservationId) {
      return Object.freeze({
        status: 'BROKEN_LINEAGE',
        isValid: false,
        issues: Object.freeze(['Broken or missing observation lineage']),
        observationId: obs.identity.observationId,
        reportChecksum: deterministicHash('BROKEN_LINEAGE'),
      });
    }

    // 5. Checksum verification
    const expectedChecksum = computeObservationChecksum(
      obs.identity.observationId,
      obs.identity.targetRealityStateId,
      obs.realityStateChecksum,
      obs.coordinates,
      obs.dimensions,
      obs.certainty,
      obs.origin,
      obs.temporal.sequenceIndex
    );

    if (obs.observationChecksum !== expectedChecksum) {
      return Object.freeze({
        status: 'CHECKSUM_MISMATCH',
        isValid: false,
        issues: Object.freeze([`Observation checksum mismatch. Expected ${expectedChecksum}, got ${obs.observationChecksum}`]),
        observationId: obs.identity.observationId,
        reportChecksum: deterministicHash('CHECKSUM_MISMATCH'),
      });
    }

    const isValid = issues.length === 0;
    const status: ObservationValidationStatus = isValid ? 'OBSERVATION_VALID' : 'INVALID_OBSERVATION_ID';
    const reportChecksum = deterministicHash(issues.join(';') + `_${status}`);

    return Object.freeze({
      status,
      isValid,
      issues: Object.freeze(issues),
      observationId: obs.identity.observationId,
      reportChecksum,
    });
  }

  public static validateTimeline(timeline: RealityTimeline): RealityTimelineValidationReport {
    const issues: string[] = [];

    // Check sequence ordering
    for (let i = 0; i < timeline.entries.length; i++) {
      const entry = timeline.entries[i];
      if (entry.sequenceIndex !== i) {
        issues.push(`Invalid sequence index at position ${i}: got ${entry.sequenceIndex}`);
      }
    }

    const isValid = issues.length === 0;
    const reportChecksum = deterministicHash(issues.join(';') + `_${isValid}`);

    return Object.freeze({
      isValid,
      issues: Object.freeze(issues),
      timelineChecksum: timeline.timelineChecksum,
      reportChecksum,
    });
  }
}
