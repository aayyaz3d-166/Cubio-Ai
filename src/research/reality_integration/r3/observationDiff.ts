/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R3: Observation Diff Engine
 *
 * Deterministically compares two observations distinguishing CHANGED, UNCHANGED, and UNKNOWN.
 */

import {
  RealityObservationRecord,
  ObservationDiff,
  ObservationDiffField,
} from './types';

export class ObservationDiffEngine {
  public static compareObservations(
    obsA: RealityObservationRecord,
    obsB: RealityObservationRecord
  ): ObservationDiff {
    const coordsField = ObservationDiffEngine.diffValue(
      obsA.coordinates,
      obsB.coordinates,
      (a, b) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2]
    );

    const dimsField = ObservationDiffEngine.diffValue(
      obsA.dimensions,
      obsB.dimensions,
      (a, b) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2]
    );

    const certaintyField = ObservationDiffEngine.diffValue(
      obsA.certainty,
      obsB.certainty,
      (a, b) => a === b
    );

    const originField = ObservationDiffEngine.diffValue(
      obsA.origin,
      obsB.origin,
      (a, b) => a === b
    );

    const sourceField = ObservationDiffEngine.diffValue(
      obsA.provenance.source,
      obsB.provenance.source,
      (a, b) => a === b
    );

    const seqField = ObservationDiffEngine.diffValue(
      obsA.temporal.sequenceIndex,
      obsB.temporal.sequenceIndex,
      (a, b) => a === b
    );

    const stateField = ObservationDiffEngine.diffValue(
      obsA.identity.targetRealityStateId,
      obsB.identity.targetRealityStateId,
      (a, b) => a === b
    );

    const isIdentical =
      coordsField.status === 'UNCHANGED' &&
      dimsField.status === 'UNCHANGED' &&
      certaintyField.status === 'UNCHANGED' &&
      originField.status === 'UNCHANGED' &&
      sourceField.status === 'UNCHANGED' &&
      seqField.status === 'UNCHANGED' &&
      stateField.status === 'UNCHANGED' &&
      obsA.observationChecksum === obsB.observationChecksum;

    return Object.freeze({
      observationAId: obsA.identity.observationId,
      observationBId: obsB.identity.observationId,
      coordinates: coordsField,
      dimensions: dimsField,
      certainty: certaintyField,
      origin: originField,
      source: sourceField,
      sequence: seqField,
      realityState: stateField,
      isIdentical,
    });
  }

  private static diffValue<T>(
    a: T | undefined,
    b: T | undefined,
    equals: (x: T, y: T) => boolean
  ): ObservationDiffField<T> {
    if (a === undefined && b === undefined) {
      return Object.freeze({ status: 'UNKNOWN' });
    }
    if (a === undefined || b === undefined) {
      return Object.freeze({ status: 'CHANGED', before: a, after: b });
    }
    if (equals(a, b)) {
      return Object.freeze({ status: 'UNCHANGED', before: a, after: b });
    }
    return Object.freeze({ status: 'CHANGED', before: a, after: b });
  }
}
