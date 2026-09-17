/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel F11: Spatial Planning Engine
 *
 * Computes deterministic machine-readable spatial execution plans
 * to achieve desired goal relations without executing them automatically.
 *
 * Invariant: Planning is non-destructive (status: 'PLAN_READY', no auto-execution).
 */

import {
  WorldModel,
  WorldEntity,
  SpatialPlan,
  WorldRelationType,
  SpatialConstraint,
} from './types';
import { generateDeterministicPlanId, deterministicHash } from './determinism';

export class F11PlanningEngine {
  public static planSpatialGoal(
    model: WorldModel,
    targetEntityId: string,
    goalRelation: WorldRelationType,
    referenceEntityId: string
  ): SpatialPlan {
    const target = model.entities[targetEntityId];
    const reference = model.entities[referenceEntityId];

    if (!target || !reference) {
      const planId = generateDeterministicPlanId(model.modelId, 'INVALID_GOAL', 0);
      return {
        planId,
        goalDescription: `Invalid goal: missing ${!target ? targetEntityId : referenceEntityId}`,
        targetEntityId,
        referenceEntityId,
        requiredOperation: 'NONE',
        expectedPosition: [0, 0, 0],
        affectedRelations: [],
        constraints: [],
        isExecutable: false,
        status: 'INVALID',
        planChecksum: `CS_PLAN_${deterministicHash(planId)}`,
      };
    }

    const refPos = reference.coordinates || [0, 0, 0];
    const refDims = reference.dimensions || { width: 2, height: 2, depth: 2 };
    const tgtDims = target.dimensions || { width: 2, height: 2, depth: 2 };

    let expectedPosition: [number, number, number] = [...refPos];
    let operation = 'TRANSLATE';

    switch (goalRelation) {
      case 'ABOVE': {
        const offset = refDims.height / 2 + tgtDims.height / 2 + 0.5;
        expectedPosition = [refPos[0], refPos[1] + offset, refPos[2]];
        operation = `TRANSLATE_Y_+${offset.toFixed(2)}`;
        break;
      }
      case 'BELOW': {
        const offset = refDims.height / 2 + tgtDims.height / 2 + 0.5;
        expectedPosition = [refPos[0], refPos[1] - offset, refPos[2]];
        operation = `TRANSLATE_Y_-${offset.toFixed(2)}`;
        break;
      }
      case 'LEFT_OF': {
        const offset = refDims.width / 2 + tgtDims.width / 2 + 0.5;
        expectedPosition = [refPos[0] - offset, refPos[1], refPos[2]];
        operation = `TRANSLATE_X_-${offset.toFixed(2)}`;
        break;
      }
      case 'RIGHT_OF': {
        const offset = refDims.width / 2 + tgtDims.width / 2 + 0.5;
        expectedPosition = [refPos[0] + offset, refPos[1], refPos[2]];
        operation = `TRANSLATE_X_+${offset.toFixed(2)}`;
        break;
      }
      case 'FRONT_OF': {
        const offset = refDims.depth / 2 + tgtDims.depth / 2 + 0.5;
        expectedPosition = [refPos[0], refPos[1], refPos[2] + offset];
        operation = `TRANSLATE_Z_+${offset.toFixed(2)}`;
        break;
      }
      case 'BEHIND': {
        const offset = refDims.depth / 2 + tgtDims.depth / 2 + 0.5;
        expectedPosition = [refPos[0], refPos[1], refPos[2] - offset];
        operation = `TRANSLATE_Z_-${offset.toFixed(2)}`;
        break;
      }
      default: {
        expectedPosition = [refPos[0] + 3.0, refPos[1], refPos[2]];
        operation = `POSITION_NEAR`;
        break;
      }
    }

    const planId = generateDeterministicPlanId(
      model.modelId,
      `${target.name}_${goalRelation}_${reference.name}`,
      1
    );

    const goalConstraint: SpatialConstraint = {
      constraintId: `CST_GOAL_${planId}`,
      subjectEntityId: targetEntityId,
      relationType: goalRelation,
      targetEntityId: referenceEntityId,
      description: `${target.name} must be ${goalRelation} ${reference.name}`,
    };

    const planChecksum = `CS_PLAN_${deterministicHash(
      `${planId}:${targetEntityId}:${referenceEntityId}:${expectedPosition.join(',')}`
    )}`;

    return {
      planId,
      goalDescription: `Place ${target.name} ${goalRelation} ${reference.name}`,
      targetEntityId,
      referenceEntityId,
      requiredOperation: operation,
      expectedPosition: Object.freeze(expectedPosition),
      affectedRelations: [],
      constraints: Object.freeze([goalConstraint]),
      isExecutable: true,
      status: 'PLAN_READY',
      planChecksum,
    };
  }
}
