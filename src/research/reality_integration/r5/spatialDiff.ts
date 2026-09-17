/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R5: Spatial Diff Engine
 *
 * Deterministically compares two spatial relations distinguishing CHANGED, UNCHANGED, and UNKNOWN.
 */

import {
  SpatialRelation,
  SpatialDiff,
  SpatialDiffField,
} from './types';

export class SpatialDiffEngine {
  public static compareRelations(relA: SpatialRelation, relB: SpatialRelation): SpatialDiff {
    const typeField = SpatialDiffEngine.diffValue(relA.relationType, relB.relationType, (a, b) => a === b);
    const evidenceField = SpatialDiffEngine.diffValue(relA.evidence, relB.evidence, (a, b) => a === b);
    const certaintyField = SpatialDiffEngine.diffValue(relA.certainty, relB.certainty, (a, b) => a === b);
    const distField = SpatialDiffEngine.diffValue(
      relA.distance.euclideanDistance,
      relB.distance.euclideanDistance,
      (a, b) => Math.abs(a - b) < 1e-6
    );
    const dirField = SpatialDiffEngine.diffValue(
      relA.direction.primaryDirection,
      relB.direction.primaryDirection,
      (a, b) => a === b
    );

    const isIdentical =
      typeField.status === 'UNCHANGED' &&
      evidenceField.status === 'UNCHANGED' &&
      certaintyField.status === 'UNCHANGED' &&
      distField.status === 'UNCHANGED' &&
      dirField.status === 'UNCHANGED' &&
      relA.relationChecksum === relB.relationChecksum;

    return Object.freeze({
      relationAId: relA.relationId,
      relationBId: relB.relationId,
      relationType: typeField,
      evidence: evidenceField,
      certainty: certaintyField,
      distance: distField,
      direction: dirField,
      isIdentical,
    });
  }

  private static diffValue<T>(
    a: T | undefined,
    b: T | undefined,
    equals: (x: T, y: T) => boolean
  ): SpatialDiffField<T> {
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
