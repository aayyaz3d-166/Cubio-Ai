/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel F11: Spatial Constraint Engine
 *
 * Evaluates spatial constraints (ABOVE, LEFT_OF, INSIDE, NEAR, DISJOINT, BETWEEN)
 * against the World Model state.
 */

import {
  WorldModel,
  SpatialConstraint,
  ConstraintEvaluation,
  ConstraintEvaluationStatus,
  Evidence,
  WorldRelation,
} from './types';
import { generateDeterministicConstraintId } from './determinism';

export class F11ConstraintEngine {
  public static createConstraint(
    modelId: string,
    subjectEntityId: string,
    relationType: any,
    targetEntityId: string,
    secondaryTargetEntityId?: string,
    description = '',
    seq = 0
  ): Readonly<SpatialConstraint> {
    const constraintId = generateDeterministicConstraintId(modelId, seq);
    return Object.freeze({
      constraintId,
      subjectEntityId,
      relationType,
      targetEntityId,
      secondaryTargetEntityId,
      description:
        description ||
        `${subjectEntityId} must be ${relationType} ${targetEntityId}${secondaryTargetEntityId ? ` and ${secondaryTargetEntityId}` : ''}`,
    });
  }

  public static evaluateConstraint(
    constraint: SpatialConstraint,
    model: WorldModel
  ): ConstraintEvaluation {
    const subj = model.entities[constraint.subjectEntityId];
    const tgt = model.entities[constraint.targetEntityId];

    if (!subj || !tgt) {
      return {
        constraintId: constraint.constraintId,
        status: 'UNKNOWN',
        reason: `Missing entity: ${!subj ? constraint.subjectEntityId : constraint.targetEntityId}`,
        evidence: null,
      };
    }

    // Special Case: BETWEEN (e.g. A BETWEEN B AND C)
    if (constraint.relationType === 'BETWEEN' && constraint.secondaryTargetEntityId) {
      const tgt2 = model.entities[constraint.secondaryTargetEntityId];
      if (!tgt2 || !subj.coordinates || !tgt.coordinates || !tgt2.coordinates) {
        return {
          constraintId: constraint.constraintId,
          status: 'UNKNOWN',
          reason: 'Entities lack 3D spatial coordinates to evaluate BETWEEN constraint.',
          evidence: null,
        };
      }

      const x = subj.coordinates[0];
      const x1 = tgt.coordinates[0];
      const x2 = tgt2.coordinates[0];
      const isBetweenX = (x >= Math.min(x1, x2) && x <= Math.max(x1, x2));

      if (isBetweenX) {
        return {
          constraintId: constraint.constraintId,
          status: 'SATISFIED',
          reason: `${subj.name} (X=${x.toFixed(2)}) is between ${tgt.name} (X=${x1.toFixed(2)}) and ${tgt2.name} (X=${x2.toFixed(2)})`,
          evidence: {
            evidenceId: `EVID_CST_${constraint.constraintId}`,
            evidenceType: 'DERIVED_FROM_GEOMETRY',
            sourceFactIds: [subj.entityId, tgt.entityId, tgt2.entityId],
            method: '1D_INTERVAL_MEMBERSHIP',
            description: 'Coordinate interval check',
            evidenceChecksum: 'CS_EVID_BETWEEN',
          },
        };
      } else {
        return {
          constraintId: constraint.constraintId,
          status: 'VIOLATED',
          reason: `${subj.name} (X=${x.toFixed(2)}) is NOT between ${tgt.name} (X=${x1.toFixed(2)}) and ${tgt2.name} (X=${x2.toFixed(2)})`,
          evidence: null,
        };
      }
    }

    // Lookup in all direct & inferred relations
    const allRelations = [...model.relations, ...model.inferences.map((i) => i.derivedRelation)];
    const matchingRel = allRelations.find(
      (r) =>
        r.sourceEntityId === constraint.subjectEntityId &&
        r.targetEntityId === constraint.targetEntityId &&
        r.relationType === constraint.relationType
    );

    if (matchingRel) {
      return {
        constraintId: constraint.constraintId,
        status: 'SATISFIED',
        reason: `${subj.name} is ${constraint.relationType} ${tgt.name} (${matchingRel.category})`,
        evidence: matchingRel.evidence,
      };
    }

    // Check for explicit contrary relation (e.g. expected ABOVE, but relation is BELOW)
    const contraryTypes: Record<string, string> = {
      ABOVE: 'BELOW',
      BELOW: 'ABOVE',
      LEFT_OF: 'RIGHT_OF',
      RIGHT_OF: 'LEFT_OF',
      FRONT_OF: 'BEHIND',
      BEHIND: 'FRONT_OF',
      INSIDE: 'CONTAINS',
    };

    const contraryType = contraryTypes[constraint.relationType];
    if (contraryType) {
      const hasContrary = allRelations.some(
        (r) =>
          r.sourceEntityId === constraint.subjectEntityId &&
          r.targetEntityId === constraint.targetEntityId &&
          r.relationType === contraryType
      );
      if (hasContrary) {
        return {
          constraintId: constraint.constraintId,
          status: 'VIOLATED',
          reason: `${subj.name} is ${contraryType} ${tgt.name}, violating constraint ${constraint.relationType}`,
          evidence: null,
        };
      }
    }

    return {
      constraintId: constraint.constraintId,
      status: 'VIOLATED',
      reason: `Relation ${constraint.relationType} not established between ${subj.name} and ${tgt.name}`,
      evidence: null,
    };
  }
}
