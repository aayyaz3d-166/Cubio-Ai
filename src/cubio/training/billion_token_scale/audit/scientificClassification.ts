/**
 * CubiO — Universal Spatial Operating Environment
 * Step 84: Scientific Classification Guard
 *
 * Enforces strict scientific classification boundaries:
 * - REAL_MEASURED / REAL_EXECUTED for actual execution
 * - SOFTWARE_VALIDATED for algorithmic checks
 * - THEORETICAL for 10B+ projections
 * - NOT_EXECUTED for unexecuted milestones / models
 *
 * Classification: SOFTWARE_VALIDATED
 */

import { ResultClassification } from '../../../foundation/v1/types';

export class ScientificClassificationGuard {
  public static assertClassification(
    isExecuted: boolean,
    isPhysical: boolean
  ): ResultClassification {
    if (isExecuted && isPhysical) {
      return 'REAL_MEASURED';
    }
    if (isExecuted) {
      return 'SOFTWARE_VALIDATED';
    }
    return 'THEORETICAL';
  }
}
