/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.7: Parametric Constraints Solver & Classifier
 *
 * Implements 2D geometric constraints and evaluates constraint determinism.
 */

import { SketchConstraint, ConstraintType, SketchConstraintStatus, SketchEntity2D } from './types';
import { deterministicHash } from './determinism';

export class ParametricConstraintsEngine {
  public static evaluateConstraintStatus(
    entities: readonly SketchEntity2D[],
    constraints: readonly SketchConstraint[]
  ): SketchConstraintStatus {
    if (entities.length === 0) return 'INVALID';

    let dof = 0;
    for (const e of entities) {
      if (e.type === 'POINT') dof += 2;
      else if (e.type === 'LINE') dof += 4;
      else if (e.type === 'CIRCLE') dof += 3;
      else if (e.type === 'ARC') dof += 5;
    }

    const constraintCount = constraints.length;

    if (constraintCount === 0) {
      return 'UNDER_CONSTRAINED';
    }

    if (constraintCount > dof) {
      return 'OVER_CONSTRAINED';
    }

    if (constraintCount === dof) {
      return 'FULLY_CONSTRAINED';
    }

    return 'PARTIALLY_CONSTRAINED';
  }
}
