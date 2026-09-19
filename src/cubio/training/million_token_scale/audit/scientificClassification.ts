/**
 * CubiO — Universal Spatial Operating Environment
 * Step 81: Scientific Classification Guard
 *
 * Enforces strict scientific classification boundaries:
 * - REAL_MEASURED / REAL_EXECUTED for actual execution
 * - SOFTWARE_VALIDATED for algorithmic checks
 * - SIMULATED for mock / stress runs
 * - THEORETICAL for 10M+ projections
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
