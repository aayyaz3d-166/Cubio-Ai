/**
 * CubiO — Step 85 Scientific Classification
 * Strict classifier for separating physical execution from software validation and theory.
 */

import { ScientificClassification } from '../../../distillation/types';

export class ScientificClassifier {
  public static classifyMetric(isPhysical: boolean, isMeasured: boolean, isTheoretical: boolean): ScientificClassification {
    if (isTheoretical) return 'THEORETICAL';
    if (isPhysical && isMeasured) return 'REAL_EXECUTED';
    if (isMeasured) return 'REAL_MEASURED';
    return 'SOFTWARE_VALIDATED';
  }
}
